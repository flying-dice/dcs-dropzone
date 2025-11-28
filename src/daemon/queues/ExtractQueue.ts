import { ok } from "node:assert";
import { addSeconds } from "date-fns";
import { and, asc, avg, eq, lt, lte, ne, notExists } from "drizzle-orm";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import { getLogger } from "log4js";
import { DownloadJobStatus, ExtractJobStatus } from "../../common/data.ts";
import { TypedEventEmitter } from "../../common/TypedEventEmitter.ts";
import { spawnSevenzip } from "../child_process/sevenzip.ts";
import {
	T_DOWNLOAD_QUEUE,
	T_EXTRACT_DOWNLOAD_JOIN,
	T_EXTRACT_QUEUE,
} from "../database/schema.ts";

const logger = getLogger("ExtractQueue");

export type ExtractJob = typeof T_EXTRACT_QUEUE.$inferSelect;

export type ExtractQueueOrchestratorConfig = {
	db: BunSQLiteDatabase;
	sevenzipExecutablePath: string;
	maxRetries?: number;
};

export enum ExtractQueueEvents {
	PUSH = "push",
	EXTRACTED = "extracted",
	FAILED = "failed",
	CANCELLED = "cancelled",
}

export type ExtractQueueEventPayloads = {
	[ExtractQueueEvents.PUSH]: [ExtractJob];
	[ExtractQueueEvents.EXTRACTED]: [ExtractJob & { extractedPath: string }];
	[ExtractQueueEvents.FAILED]: [ExtractJob];
	[ExtractQueueEvents.CANCELLED]: [ExtractJob[]];
};

export class ExtractQueue extends TypedEventEmitter<ExtractQueueEventPayloads> {
	private readonly db: BunSQLiteDatabase;
	private readonly sevenzipExecutablePath: string;
	private readonly maxRetries: number;

	private active: {
		job: ExtractJob;
		abortController: AbortController;
	} | null = null;

	constructor(config: ExtractQueueOrchestratorConfig) {
		super();
		this.db = config.db;
		this.sevenzipExecutablePath = config.sevenzipExecutablePath;
		this.maxRetries = config.maxRetries ?? 3;

		logger.info("ExtractQueueOrchestrator initialized", {
			maxRetries: this.maxRetries,
		});

		// Listen to events to trigger the next job without Delay
		this.on(ExtractQueueEvents.PUSH, () => this.startNextExtractJob());
		this.on(ExtractQueueEvents.EXTRACTED, () => this.startNextExtractJob());
		this.on(ExtractQueueEvents.FAILED, () => this.startNextExtractJob());

		// Periodically check for new jobs every 30 seconds
		setInterval(() => {
			this.startNextExtractJob();
		}, 30000);

		// Resume any in-progress jobs on startup
		this.startNextExtractJob();
	}

	pushJob(
		releaseId: string,
		releaseAssetId: string,
		id: string,
		archivePath: string,
		targetDirectory: string,
		downloadJobIds: string[],
	): void {
		logger.debug(
			`[${id}] - Pushing new extract job to queue: ${archivePath} -> ${targetDirectory}`,
		);
		const job = this.db
			.insert(T_EXTRACT_QUEUE)
			.values({
				id,
				archivePath,
				targetDirectory,
				createdAt: new Date(),
				nextAttemptAfter: new Date(),
				releaseAssetId,
				releaseId,
			})
			.returning()
			.get();

		// Insert join table entries for all related download jobs
		for (const downloadJobId of downloadJobIds) {
			this.db
				.insert(T_EXTRACT_DOWNLOAD_JOIN)
				.values({
					id: `${id}:${downloadJobId}`,
					extractJobId: id,
					downloadJobId,
				})
				.run();
		}

		this.emit(ExtractQueueEvents.PUSH, job);
	}

	getOverallProgressForRelease(releaseId: string): number {
		const average = this.db
			.select({
				progressPercent: avg(T_EXTRACT_QUEUE.progressPercent),
			})
			.from(T_EXTRACT_QUEUE)
			.where(eq(T_EXTRACT_QUEUE.releaseId, releaseId))
			.get();

		return Math.floor(Number(average?.progressPercent ?? 0));
	}

	cancelJobsForRelease(releaseId: string): void {
		logger.info(`Cancelling extract jobs for release ID: ${releaseId}`);

		if (this.active && this.active.job.releaseId === releaseId) {
			this.active.abortController.abort("Job cancelled by user");
			this.active = null;
			logger.info(`Aborted active extract job for release id: ${releaseId}`);
		}

		// First delete join table entries
		const extractJobs = this.db
			.select({ id: T_EXTRACT_QUEUE.id })
			.from(T_EXTRACT_QUEUE)
			.where(eq(T_EXTRACT_QUEUE.releaseId, releaseId))
			.all();

		for (const extractJob of extractJobs) {
			this.db
				.delete(T_EXTRACT_DOWNLOAD_JOIN)
				.where(eq(T_EXTRACT_DOWNLOAD_JOIN.extractJobId, extractJob.id))
				.run();
		}

		const result = this.db
			.delete(T_EXTRACT_QUEUE)
			.where(and(eq(T_EXTRACT_QUEUE.releaseId, releaseId)))
			.returning()
			.all();

		logger.info(
			`Cancelled ${result.length} extract jobs for release id: ${releaseId}`,
		);

		this.emit(ExtractQueueEvents.CANCELLED, result);
	}

	private startNextExtractJob(): void {
		if (this.active) return;
		const job = this.selectOrClaimNextJob();

		if (!job) {
			logger.info("No pending extract jobs in the queue");
			return;
		}

		this.processJob(job)
			.then(() => {
				logger.debug(`[${job.id}] - Job processing completed`);
			})
			.catch((err) => {
				logger.error(`[${job.id}] - Error processing job: ${err}`);
			});
	}

	private selectOrClaimNextJob(): ExtractJob | undefined {
		logger.info("Fetching next extract job");

		const existingJob = this.db
			.select()
			.from(T_EXTRACT_QUEUE)
			.where(eq(T_EXTRACT_QUEUE.status, ExtractJobStatus.IN_PROGRESS))
			.get();

		if (existingJob) {
			return existingJob;
		}

		// Find extract jobs where all dependent download jobs are completed
		// This uses a NOT EXISTS subquery to ensure no incomplete downloads exist
		return this.db
			.update(T_EXTRACT_QUEUE)
			.set({
				status: ExtractJobStatus.IN_PROGRESS,
			})
			.where(
				and(
					eq(T_EXTRACT_QUEUE.status, ExtractJobStatus.PENDING),
					lt(T_EXTRACT_QUEUE.attempt, T_EXTRACT_QUEUE.maxAttempts),
					lte(T_EXTRACT_QUEUE.nextAttemptAfter, new Date()),
					// Ensure all dependent download jobs are completed
					// Uses notExists to check that no incomplete downloads exist
					notExists(
						this.db
							.select({ id: T_EXTRACT_DOWNLOAD_JOIN.id })
							.from(T_EXTRACT_DOWNLOAD_JOIN)
							.innerJoin(
								T_DOWNLOAD_QUEUE,
								eq(T_EXTRACT_DOWNLOAD_JOIN.downloadJobId, T_DOWNLOAD_QUEUE.id),
							)
							.where(
								and(
									eq(T_EXTRACT_DOWNLOAD_JOIN.extractJobId, T_EXTRACT_QUEUE.id),
									// Download is NOT completed (PENDING or IN_PROGRESS)
									ne(T_DOWNLOAD_QUEUE.status, DownloadJobStatus.COMPLETED),
								),
							),
					),
				),
			)
			.orderBy(asc(T_EXTRACT_QUEUE.createdAt))
			.limit(1)
			.returning()
			.get();
	}

	private async processJob(job: ExtractJob): Promise<void> {
		ok(!this.active, "Expected no active job when processing a new job");

		logger.info(`[${job.id}] - Starting extract job`);
		const abortController = new AbortController();

		this.active = { job, abortController };

		const result = await spawnSevenzip(
			{
				archivePath: job.archivePath,
				exePath: this.sevenzipExecutablePath,
				targetDir: job.targetDirectory,
				onProgress: (p) => {
					logger.info(
						`[${job.id}] - Extract progress: ${p.progress.toFixed(2)}% ${p.summary}`,
					);
					this.db
						.update(T_EXTRACT_QUEUE)
						.set({
							progressPercent: p.progress,
						})
						.where(eq(T_EXTRACT_QUEUE.id, job.id))
						.run();
				},
			},
			abortController.signal,
		);

		result.match(
			(extractedPath) => {
				logger.info(`[${job.id}] - Extraction completed: ${extractedPath}`);

				const _job = this.db
					.update(T_EXTRACT_QUEUE)
					.set({
						status: ExtractJobStatus.COMPLETED,
						progressPercent: 100,
					})
					.where(eq(T_EXTRACT_QUEUE.id, job.id))
					.returning()
					.get();

				this.emit(ExtractQueueEvents.EXTRACTED, { ..._job, extractedPath });
			},
			(error) => {
				logger.error(`[${job.id}] - Extraction failed: ${error}`);
				const _job = this.db
					.update(T_EXTRACT_QUEUE)
					.set({
						status: ExtractJobStatus.PENDING,
						attempt: job.attempt + 1,
						nextAttemptAfter: addSeconds(new Date(), 30), // Retry after a minimum 30 seconds
					})
					.where(eq(T_EXTRACT_QUEUE.id, job.id))
					.returning()
					.get();

				this.emit(ExtractQueueEvents.FAILED, _job);
			},
		);

		logger.debug(`[${job.id}] - Finished extract job, clearing active job ID`);
		this.active = null;
	}
}
