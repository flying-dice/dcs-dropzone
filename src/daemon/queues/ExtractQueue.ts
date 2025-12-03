import { ok } from "node:assert";
import { addSeconds } from "date-fns";
import { and, asc, eq, lt, lte, ne, notExists } from "drizzle-orm";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import { getLogger } from "log4js";
import { DownloadJobStatus, ExtractJobStatus } from "../../common/data.ts";
import { spawnSevenzip } from "../child_process/sevenzip.ts";
import { T_DOWNLOAD_QUEUE, T_EXTRACT_DOWNLOAD_JOIN, T_EXTRACT_QUEUE } from "../database/schema.ts";
import type { DownloadQueue } from "./DownloadQueue.ts";

const logger = getLogger("ExtractQueue");

export type ExtractJob = typeof T_EXTRACT_QUEUE.$inferSelect;

export type ExtractQueueOrchestratorConfig = {
	db: BunSQLiteDatabase;
	sevenzipExecutablePath: string;
	downloadQueue: DownloadQueue;
};

export class ExtractQueue {
	private readonly db: BunSQLiteDatabase;
	private readonly sevenzipExecutablePath: string;

	private active: {
		job: ExtractJob;
		abortController: AbortController;
	} | null = null;

	constructor(config: ExtractQueueOrchestratorConfig) {
		this.db = config.db;
		this.sevenzipExecutablePath = config.sevenzipExecutablePath;

		setInterval(() => {
			if (!this.active) this.startNextExtractJob();
		}, 1000);
	}

	pushJob(
		releaseId: string,
		releaseAssetId: string,
		id: string,
		archivePath: string,
		targetDirectory: string,
		downloadJobIds: string[],
	): void {
		logger.debug(`[${id}] - Pushing new extract job to queue: ${archivePath} -> ${targetDirectory}`);
		this.db.transaction((tx) => {
			const insertedJob = tx
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
				tx.insert(T_EXTRACT_DOWNLOAD_JOIN)
					.values({
						id: `${id}:${downloadJobId}`,
						extractJobId: id,
						downloadJobId,
					})
					.run();
			}

			return insertedJob;
		});
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
			this.db.delete(T_EXTRACT_DOWNLOAD_JOIN).where(eq(T_EXTRACT_DOWNLOAD_JOIN.extractJobId, extractJob.id)).run();
		}

		const result = this.db
			.delete(T_EXTRACT_QUEUE)
			.where(and(eq(T_EXTRACT_QUEUE.releaseId, releaseId)))
			.returning()
			.all();

		logger.info(`Cancelled ${result.length} extract jobs for release id: ${releaseId}`);
	}

	private startNextExtractJob(): void {
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

	private selectOrClaimNextJob(): ExtractJob | undefined {
		const existingJob = this.db
			.select()
			.from(T_EXTRACT_QUEUE)
			.where(eq(T_EXTRACT_QUEUE.status, ExtractJobStatus.IN_PROGRESS))
			.get();

		if (existingJob) {
			return existingJob;
		}

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
					notExists(
						this.db
							.select({ id: T_EXTRACT_DOWNLOAD_JOIN.id })
							.from(T_EXTRACT_DOWNLOAD_JOIN)
							.innerJoin(T_DOWNLOAD_QUEUE, eq(T_EXTRACT_DOWNLOAD_JOIN.downloadJobId, T_DOWNLOAD_QUEUE.id))
							.where(
								and(
									eq(T_EXTRACT_DOWNLOAD_JOIN.extractJobId, T_EXTRACT_QUEUE.id),
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
					logger.info(`[${job.id}] - Extract progress: ${p.progress.toFixed(2)}%${p.summary ? ` ${p.summary}` : ""}`);
					this.db
						.update(T_EXTRACT_QUEUE)
						.set({ progressPercent: p.progress })
						.where(eq(T_EXTRACT_QUEUE.id, job.id))
						.run();
				},
			},
			abortController.signal,
		);

		result.match(
			(extractedPath) => {
				logger.info(`[${job.id}] - Extraction completed: ${extractedPath}`);

				this.db
					.update(T_EXTRACT_QUEUE)
					.set({
						status: ExtractJobStatus.COMPLETED,
						progressPercent: 100,
					})
					.where(eq(T_EXTRACT_QUEUE.id, job.id))
					.returning()
					.get();
			},
			(error) => {
				logger.error(`[${job.id}] - Extraction failed: ${error}`);
				this.db
					.update(T_EXTRACT_QUEUE)
					.set({
						status: ExtractJobStatus.PENDING,
						attempt: job.attempt + 1,
						nextAttemptAfter: addSeconds(new Date(), 30), // Retry after a minimum 30 seconds
					})
					.where(eq(T_EXTRACT_QUEUE.id, job.id))
					.returning()
					.get();
			},
		);

		logger.debug(`[${job.id}] - Finished extract job, clearing active job ID`);
		this.active = null;
	}
}
