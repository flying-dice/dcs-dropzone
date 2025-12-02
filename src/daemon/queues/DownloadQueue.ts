import { ok } from "node:assert";
import { addSeconds } from "date-fns";
import { and, asc, avg, eq, lt, lte } from "drizzle-orm";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import { getLogger } from "log4js";
import { DownloadJobStatus } from "../../common/data.ts";
import { TypedEventEmitter } from "../../common/TypedEventEmitter.ts";
import { spawnWget } from "../child_process/wget.ts";
import { T_DOWNLOAD_QUEUE } from "../database/schema.ts";

const logger = getLogger("DownloadQueue");

export type DownloadJob = typeof T_DOWNLOAD_QUEUE.$inferSelect;

export type DownloadQueueOrchestratorConfig = {
	db: BunSQLiteDatabase;
	wgetExecutablePath: string;
	maxRetries?: number;
};

export enum DownloadQueueEvents {
	PUSH = "push",
	DOWNLOADED = "downloaded",
	FAILED = "failed",
	CANCELLED = "cancelled",
}
export type DownloadQueueEventPayloads = {
	[DownloadQueueEvents.PUSH]: [DownloadJob];
	[DownloadQueueEvents.DOWNLOADED]: [DownloadJob & { filePath: string }];
	[DownloadQueueEvents.FAILED]: [DownloadJob];
	[DownloadQueueEvents.CANCELLED]: [DownloadJob[]];
};

export class DownloadQueue extends TypedEventEmitter<DownloadQueueEventPayloads> {
	private readonly db: BunSQLiteDatabase;
	private readonly wgetExecutablePath: string;
	private readonly maxRetries: number;

	private active: {
		job: DownloadJob;
		abortController: AbortController;
	} | null = null;

	constructor(config: DownloadQueueOrchestratorConfig) {
		super();
		this.db = config.db;
		this.wgetExecutablePath = config.wgetExecutablePath;
		this.maxRetries = config.maxRetries ?? 3;

		logger.info("DownloadQueueOrchestrator initialized", {
			maxRetries: this.maxRetries,
		});

		// Listen to events to trigger the next job without Delay
		this.on(DownloadQueueEvents.PUSH, () => this.startNextDownloadJob());
		this.on(DownloadQueueEvents.DOWNLOADED, () => this.startNextDownloadJob());
		this.on(DownloadQueueEvents.FAILED, () => this.startNextDownloadJob());

		// Periodically check for new jobs every 30 seconds
		setInterval(() => {
			this.startNextDownloadJob();
		}, 30000);

		// Resume any in-progress jobs on startup
		this.startNextDownloadJob();
	}

	pushJob(releaseId: string, releaseAssetId: string, id: string, url: string, targetDirectory: string): void {
		logger.debug(`[${id}] - Pushing new download job to queue: ${url} -> ${targetDirectory}`);
		const job = this.db
			.insert(T_DOWNLOAD_QUEUE)
			.values({
				id,
				url,
				targetDirectory,
				createdAt: new Date(),
				nextAttemptAfter: new Date(),
				releaseAssetId,
				releaseId,
			})
			.returning()
			.get();

		this.emit(DownloadQueueEvents.PUSH, job);
	}

	getOverallProgressForRelease(releaseId: string): number {
		const average = this.db
			.select({
				progressPercent: avg(T_DOWNLOAD_QUEUE.progressPercent),
			})
			.from(T_DOWNLOAD_QUEUE)
			.where(eq(T_DOWNLOAD_QUEUE.releaseId, releaseId))
			.get();

		return Math.floor(Number(average?.progressPercent ?? 0));
	}

	cancelJobsForRelease(releaseId: string): void {
		logger.info(`Cancelling download jobs for release ID: ${releaseId}`);

		if (this.active && this.active.job.releaseId === releaseId) {
			this.active.abortController.abort("Job cancelled by user");
			this.active = null;
			logger.info(`Aborted active download job for release id: ${releaseId}`);
		}

		const result = this.db
			.delete(T_DOWNLOAD_QUEUE)
			.where(and(eq(T_DOWNLOAD_QUEUE.releaseId, releaseId)))
			.returning()
			.all();

		logger.info(`Cancelled ${result.length} download jobs for release id: ${releaseId}`);

		this.emit(DownloadQueueEvents.CANCELLED, result);
	}

	private startNextDownloadJob(): void {
		if (this.active) return;
		const job = this.selectOrClaimNextJob();

		if (!job) {
			logger.info("No pending download jobs in the queue");
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

	private selectOrClaimNextJob(): DownloadJob | undefined {
		logger.info("Fetching next job");

		const existingJob = this.db
			.select()
			.from(T_DOWNLOAD_QUEUE)
			.where(eq(T_DOWNLOAD_QUEUE.status, DownloadJobStatus.IN_PROGRESS))
			.get();

		if (existingJob) {
			return existingJob;
		}

		return this.db
			.update(T_DOWNLOAD_QUEUE)
			.set({
				status: DownloadJobStatus.IN_PROGRESS,
			})
			.where(
				and(
					eq(T_DOWNLOAD_QUEUE.status, DownloadJobStatus.PENDING),
					lt(T_DOWNLOAD_QUEUE.attempt, T_DOWNLOAD_QUEUE.maxAttempts),
					lte(T_DOWNLOAD_QUEUE.nextAttemptAfter, new Date()),
				),
			)
			.orderBy(asc(T_DOWNLOAD_QUEUE.createdAt))
			.limit(1)
			.returning()
			.get();
	}

	private async processJob(job: DownloadJob): Promise<void> {
		ok(!this.active, "Expected no active job when processing a new job");

		logger.info(`[${job.id}] - Starting download job`);
		const abortController = new AbortController();

		this.active = { job, abortController };

		const result = await spawnWget(
			{
				url: job.url,
				exePath: this.wgetExecutablePath,
				target: job.targetDirectory,
				onProgress: (p) => {
					logger.info(`[${job.id}] - Download progress: ${p.progress.toFixed(2)}% ${p.summary}`);
					this.db
						.update(T_DOWNLOAD_QUEUE)
						.set({
							progressPercent: p.progress,
						})
						.where(eq(T_DOWNLOAD_QUEUE.id, job.id))
						.run();
				},
			},
			abortController.signal,
		);

		result.match(
			(filePath) => {
				logger.info(`[${job.id}] - Download completed: ${filePath}`);

				const _job = this.db
					.update(T_DOWNLOAD_QUEUE)
					.set({
						status: DownloadJobStatus.COMPLETED,
						progressPercent: 100,
					})
					.where(eq(T_DOWNLOAD_QUEUE.id, job.id))
					.returning()
					.get();

				this.emit(DownloadQueueEvents.DOWNLOADED, { ..._job, filePath });
			},
			(error) => {
				logger.error(`[${job.id}] - Download failed: ${error}`);
				const _job = this.db
					.update(T_DOWNLOAD_QUEUE)
					.set({
						status: DownloadJobStatus.PENDING,
						attempt: job.attempt + 1,
						nextAttemptAfter: addSeconds(new Date(), 30), // Retry after a minimum 30 seconds
					})
					.where(eq(T_DOWNLOAD_QUEUE.id, job.id))
					.returning()
					.get();

				this.emit(DownloadQueueEvents.FAILED, _job);
			},
		);

		logger.debug(`[${job.id}] - Finished download job, clearing active job ID`);
		this.active = null;
	}
}
