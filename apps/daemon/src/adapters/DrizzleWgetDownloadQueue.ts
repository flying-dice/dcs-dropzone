import { ok } from "node:assert";
import { addSeconds } from "date-fns";
import { and, asc, eq, lte } from "drizzle-orm";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import { getLogger } from "log4js";
import { DownloadJobStatus } from "../application/enums/DownloadJobStatus.ts";
import type { DownloadQueue } from "../application/ports/DownloadQueue.ts";
import { spawnWget } from "../child_process/wget.ts";
import { T_DOWNLOAD_QUEUE } from "../database/schema.ts";

const logger = getLogger("DrizzleDownloadQueue");

export type DownloadJob = typeof T_DOWNLOAD_QUEUE.$inferSelect;

export type DownloadQueueOrchestratorConfig = {
	db: BunSQLiteDatabase;
	wgetExecutablePath: string;
};

export class DrizzleWgetDownloadQueue implements DownloadQueue {
	private readonly db: BunSQLiteDatabase;
	private readonly wgetExecutablePath: string;

	private active: {
		job: DownloadJob;
		abortController: AbortController;
	} | null = null;

	constructor(config: DownloadQueueOrchestratorConfig) {
		this.db = config.db;
		this.wgetExecutablePath = config.wgetExecutablePath;

		setInterval(() => {
			if (!this.active) this.startNextDownloadJob();
		}, 1000);
	}

	pushJob(releaseId: string, releaseAssetId: string, id: string, url: string, targetDirectory: string): void {
		logger.debug(`[${id}] - Pushing new download job to queue: ${url} -> ${targetDirectory}`);
		this.db
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
	}

	private startNextDownloadJob(): void {
		if (this.active) return;
		const job = this.selectOrClaimNextJob();

		if (!job) {
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
				and(eq(T_DOWNLOAD_QUEUE.status, DownloadJobStatus.PENDING), lte(T_DOWNLOAD_QUEUE.nextAttemptAfter, new Date())),
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

				this.db
					.update(T_DOWNLOAD_QUEUE)
					.set({
						status: DownloadJobStatus.COMPLETED,
						progressPercent: 100,
					})
					.where(eq(T_DOWNLOAD_QUEUE.id, job.id))
					.returning()
					.get();
			},
			(error) => {
				logger.error(`[${job.id}] - Download failed: ${error}`);
				this.db
					.update(T_DOWNLOAD_QUEUE)
					.set({
						status: DownloadJobStatus.PENDING,
						attempt: job.attempt + 1,
						nextAttemptAfter: addSeconds(new Date(), 30),
					})
					.where(eq(T_DOWNLOAD_QUEUE.id, job.id))
					.returning()
					.get();
			},
		);

		logger.debug(`[${job.id}] - Finished download job, clearing active job ID`);
		this.active = null;
	}

	getJobsForReleaseId(releaseId: string): {
		id: string;
		releaseId: string;
		releaseAssetId: string;
		url: string;
		targetDirectory: string;
		status: DownloadJobStatus;
		progressPercent: number;
		attempt: number;
		nextAttemptAfter: Date;
		createdAt: Date;
	}[] {
		return this.db.select().from(T_DOWNLOAD_QUEUE).where(eq(T_DOWNLOAD_QUEUE.releaseId, releaseId)).all();
	}

	getJobsForReleaseAssetId(releaseAssetId: string): {
		id: string;
		releaseId: string;
		releaseAssetId: string;
		url: string;
		targetDirectory: string;
		status: DownloadJobStatus;
		progressPercent: number;
		attempt: number;
		nextAttemptAfter: Date;
		createdAt: Date;
	}[] {
		return this.db.select().from(T_DOWNLOAD_QUEUE).where(eq(T_DOWNLOAD_QUEUE.releaseAssetId, releaseAssetId)).all();
	}
}
