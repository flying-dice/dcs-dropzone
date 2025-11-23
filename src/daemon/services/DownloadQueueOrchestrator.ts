import { mkdir } from "node:fs/promises";
import { and, eq, lte, or } from "drizzle-orm";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import type { Logger } from "pino";
import {
	DownloadJobStatus,
	type DownloadQueueJob,
	T_DOWNLOAD_QUEUE,
} from "../database/schema-download-queue.ts";
import { BaseProcess } from "../processes/BaseProcess.ts";
import { WgetProcess } from "../processes/WgetProcess.ts";

/**
 * Download Queue Orchestrator Configuration
 */
export type DownloadQueueOrchestratorConfig = {
	db: BunSQLiteDatabase;
	wgetExecutablePath: string;
	logger: Logger;
	maxConcurrentDownloads?: number;
	pollIntervalMs?: number;
	maxRetries?: number;
	initialRetryDelayMs?: number;
};

/**
 * Download Queue Orchestrator
 * Manages the lifecycle of download jobs with persistence, retry, and recovery
 */
export class DownloadQueueOrchestrator {
	private readonly db: BunSQLiteDatabase;
	private readonly wgetExecutablePath: string;
	private readonly logger: Logger;
	private readonly maxConcurrentDownloads: number;
	private readonly pollIntervalMs: number;
	private readonly maxRetries: number;
	private readonly initialRetryDelayMs: number;

	private pollTimer?: NodeJS.Timeout;
	private isRunning = false;

	constructor(config: DownloadQueueOrchestratorConfig) {
		this.db = config.db;
		this.wgetExecutablePath = config.wgetExecutablePath;
		this.logger = config.logger;
		this.maxConcurrentDownloads = config.maxConcurrentDownloads ?? 3;
		this.pollIntervalMs = config.pollIntervalMs ?? 1000;
		this.maxRetries = config.maxRetries ?? 3;
		this.initialRetryDelayMs = config.initialRetryDelayMs ?? 2000;

		this.logger.info(
			{
				maxConcurrentDownloads: this.maxConcurrentDownloads,
				pollIntervalMs: this.pollIntervalMs,
				maxRetries: this.maxRetries,
			},
			"DownloadQueueOrchestrator initialized",
		);
	}

	/**
	 * Start the orchestrator
	 * Performs crash recovery and begins polling
	 */
	async start(): Promise<void> {
		if (this.isRunning) {
			this.logger.warn("Orchestrator is already running");
			return;
		}

		this.logger.info("Starting DownloadQueueOrchestrator");

		// Perform zombie sweep (crash recovery)
		await this.performZombieSweep();

		// Start polling
		this.isRunning = true;
		this.poll();

		this.logger.info("DownloadQueueOrchestrator started");
	}

	/**
	 * Stop the orchestrator
	 */
	async stop(): Promise<void> {
		if (!this.isRunning) {
			this.logger.warn("Orchestrator is not running");
			return;
		}

		this.logger.info("Stopping DownloadQueueOrchestrator");

		// Stop polling
		this.isRunning = false;
		if (this.pollTimer) {
			clearTimeout(this.pollTimer);
			this.pollTimer = undefined;
		}

		// Cancel all active jobs
		const activeJobIds = BaseProcess.getActiveJobIds();
		this.logger.info(
			{ activeJobCount: activeJobIds.length },
			"Cancelling active jobs",
		);

		for (const jobId of activeJobIds) {
			await BaseProcess.cancelJob(jobId);
		}

		this.logger.info("DownloadQueueOrchestrator stopped");
	}

	/**
	 * Zombie Sweep: Reset jobs stuck in PROCESSING state
	 * This handles crash recovery by resetting orphaned jobs
	 */
	private async performZombieSweep(): Promise<void> {
		this.logger.info("Performing zombie sweep (crash recovery)");

		const zombieJobs = this.db
			.select()
			.from(T_DOWNLOAD_QUEUE)
			.where(eq(T_DOWNLOAD_QUEUE.status, DownloadJobStatus.PROCESSING))
			.all();

		this.logger.info(
			{ zombieCount: zombieJobs.length },
			"Found zombie jobs from previous crash",
		);

		for (const job of zombieJobs) {
			// Check if we should retry or mark as failed
			if (job.retryCount < job.maxRetries) {
				this.logger.info({ jobId: job.id }, "Resetting zombie job to RETRYING");
				this.db
					.update(T_DOWNLOAD_QUEUE)
					.set({
						status: DownloadJobStatus.RETRYING,
						pid: null,
						nextRetryAt: new Date(
							Date.now() + this.calculateRetryDelay(job.retryCount),
						),
						updatedAt: new Date(),
					})
					.where(eq(T_DOWNLOAD_QUEUE.id, job.id))
					.run();
			} else {
				this.logger.info(
					{ jobId: job.id },
					"Zombie job exceeded max retries, marking as FAILED",
				);
				this.db
					.update(T_DOWNLOAD_QUEUE)
					.set({
						status: DownloadJobStatus.FAILED,
						pid: null,
						updatedAt: new Date(),
					})
					.where(eq(T_DOWNLOAD_QUEUE.id, job.id))
					.run();
			}
		}

		this.logger.info("Zombie sweep completed");
	}

	/**
	 * Poll for jobs to process
	 */
	private poll(): void {
		if (!this.isRunning) {
			return;
		}

		try {
			this.processNextJobs();
		} catch (error) {
			this.logger.error({ error }, "Error during poll cycle");
		}

		// Schedule next poll
		this.pollTimer = setTimeout(() => this.poll(), this.pollIntervalMs);
	}

	/**
	 * Process next available jobs
	 */
	private processNextJobs(): void {
		const activeCount = BaseProcess.getActiveProcessCount();
		const availableSlots = this.maxConcurrentDownloads - activeCount;

		if (availableSlots <= 0) {
			return; // No capacity
		}

		// Get jobs eligible for processing
		const now = Date.now();
		const eligibleJobs = this.db
			.select()
			.from(T_DOWNLOAD_QUEUE)
			.where(
				or(
					eq(T_DOWNLOAD_QUEUE.status, DownloadJobStatus.PENDING),
					and(
						eq(T_DOWNLOAD_QUEUE.status, DownloadJobStatus.RETRYING),
						lte(T_DOWNLOAD_QUEUE.nextRetryAt, now),
					),
				),
			)
			.limit(availableSlots)
			.all();

		for (const job of eligibleJobs) {
			this.processJob(job);
		}
	}

	/**
	 * Process a single job
	 */
	private async processJob(job: DownloadQueueJob): Promise<void> {
		this.logger.info(
			{ jobId: job.id, url: job.url },
			"Processing download job",
		);

		try {
			// Update status to PROCESSING
			this.db
				.update(T_DOWNLOAD_QUEUE)
				.set({
					status: DownloadJobStatus.PROCESSING,
					updatedAt: new Date(),
				})
				.where(eq(T_DOWNLOAD_QUEUE.id, job.id))
				.run();

			// Ensure target directory exists
			await mkdir(job.targetDirectory, { recursive: true });

			// Create wget process
			const wgetProcess = new WgetProcess({
				jobId: job.id,
				url: job.url,
				targetDirectory: job.targetDirectory,
				wgetExecutablePath: this.wgetExecutablePath,
				logger: this.logger.child({ jobId: job.id }),
			});

			// Update PID
			const pid = wgetProcess.getPid();
			if (pid) {
				this.db
					.update(T_DOWNLOAD_QUEUE)
					.set({ pid, updatedAt: new Date() })
					.where(eq(T_DOWNLOAD_QUEUE.id, job.id))
					.run();
			}

			// Start the process with progress throttling
			let lastProgressUpdate = 0;
			const progressThrottleMs = 500; // Update DB at most every 500ms

			const result = await wgetProcess.start((progress) => {
				const now = Date.now();
				if (now - lastProgressUpdate >= progressThrottleMs) {
					this.updateJobProgress(job.id, progress.progress, progress.summary);
					lastProgressUpdate = now;
				}
			});

			// Handle result
			if (result.success) {
				this.logger.info({ jobId: job.id }, "Download completed successfully");
				this.db
					.update(T_DOWNLOAD_QUEUE)
					.set({
						status: DownloadJobStatus.COMPLETED,
						progressPercent: 100,
						filename: wgetProcess.getExpectedFilename(),
						pid: null,
						updatedAt: new Date(),
					})
					.where(eq(T_DOWNLOAD_QUEUE.id, job.id))
					.run();
			} else {
				this.handleJobFailure(job, result.error);
			}
		} catch (error) {
			this.logger.error({ jobId: job.id, error }, "Error processing job");
			this.handleJobFailure(job, error as Error);
		}
	}

	/**
	 * Handle job failure with retry logic
	 */
	private handleJobFailure(job: DownloadQueueJob, error?: Error): void {
		const newRetryCount = job.retryCount + 1;

		if (newRetryCount < job.maxRetries) {
			const retryDelay = this.calculateRetryDelay(newRetryCount);
			const nextRetryAt = new Date(Date.now() + retryDelay);

			this.logger.warn(
				{
					jobId: job.id,
					retryCount: newRetryCount,
					maxRetries: job.maxRetries,
					nextRetryAt,
					error: error?.message,
				},
				"Job failed, scheduling retry",
			);

			this.db
				.update(T_DOWNLOAD_QUEUE)
				.set({
					status: DownloadJobStatus.RETRYING,
					retryCount: newRetryCount,
					nextRetryAt,
					pid: null,
					updatedAt: new Date(),
				})
				.where(eq(T_DOWNLOAD_QUEUE.id, job.id))
				.run();
		} else {
			this.logger.error(
				{
					jobId: job.id,
					retryCount: newRetryCount,
					error: error?.message,
				},
				"Job failed permanently after max retries",
			);

			this.db
				.update(T_DOWNLOAD_QUEUE)
				.set({
					status: DownloadJobStatus.FAILED,
					retryCount: newRetryCount,
					pid: null,
					updatedAt: new Date(),
				})
				.where(eq(T_DOWNLOAD_QUEUE.id, job.id))
				.run();
		}
	}

	/**
	 * Calculate retry delay with exponential backoff
	 */
	private calculateRetryDelay(retryCount: number): number {
		return this.initialRetryDelayMs * 2 ** retryCount;
	}

	/**
	 * Update job progress (throttled)
	 */
	private updateJobProgress(
		jobId: string,
		progressPercent: number,
		progressSummary?: string,
	): void {
		this.db
			.update(T_DOWNLOAD_QUEUE)
			.set({
				progressPercent,
				progressSummary,
				updatedAt: new Date(),
			})
			.where(eq(T_DOWNLOAD_QUEUE.id, jobId))
			.run();
	}

	/**
	 * Enqueue a new download job
	 */
	enqueueDownload(
		url: string,
		targetDirectory: string,
		options?: {
			maxRetries?: number;
		},
	): string {
		const jobId = `dl-${Date.now()}-${Math.random().toString(36).substring(7)}`;

		this.logger.info({ jobId, url, targetDirectory }, "Enqueuing download job");

		this.db
			.insert(T_DOWNLOAD_QUEUE)
			.values({
				id: jobId,
				url,
				targetDirectory,
				status: DownloadJobStatus.PENDING,
				retryCount: 0,
				maxRetries: options?.maxRetries ?? this.maxRetries,
				progressPercent: 0,
			})
			.run();

		return jobId;
	}

	/**
	 * Cancel a specific job
	 */
	async cancelJob(jobId: string): Promise<boolean> {
		this.logger.info({ jobId }, "Cancelling job");

		// Try to cancel active process
		const cancelled = await BaseProcess.cancelJob(jobId);

		// Update database status
		const job = this.db
			.select()
			.from(T_DOWNLOAD_QUEUE)
			.where(eq(T_DOWNLOAD_QUEUE.id, jobId))
			.get();

		if (job && job.status !== DownloadJobStatus.COMPLETED) {
			this.db
				.update(T_DOWNLOAD_QUEUE)
				.set({
					status: DownloadJobStatus.FAILED,
					pid: null,
					updatedAt: new Date(),
				})
				.where(eq(T_DOWNLOAD_QUEUE.id, jobId))
				.run();
		}

		return cancelled || job !== undefined;
	}

	/**
	 * Get job status
	 */
	getJobStatus(jobId: string): DownloadQueueJob | undefined {
		return this.db
			.select()
			.from(T_DOWNLOAD_QUEUE)
			.where(eq(T_DOWNLOAD_QUEUE.id, jobId))
			.get();
	}
}
