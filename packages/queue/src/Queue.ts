import * as assert from "node:assert";
import { EventEmitter } from "node:events";
import { getLogger } from "log4js";
import { JobErrorCode, type JobRecord, type JobRecordRepository, JobState } from "./JobRecordRepository.ts";
import { JobRun } from "./JobRun.ts";
import type { Processor } from "./Processor.ts";

export enum QueueEvents {
	Added = "added",
	Cancelled = "cancelled",
	Failed = "failed",
	Succeeded = "succeeded",
	Progress = "progress",
	Start = "start",
	Stop = "stop",
}

function humanizeJobRecord(jobRecord: JobRecord): string {
	return `JobRecord { jobId: ${jobRecord.jobId}, runId: ${jobRecord.runId}, processorName: ${jobRecord.processorName}, progress: ${jobRecord.progress}, state: ${jobRecord.state} }`;
}

const logger = getLogger("Queue");

type Deps = {
	jobRecordRepository: JobRecordRepository;
};

type Opts = {
	/**
	 * Job processors to register with the queue.
	 *
	 * Each processor is responsible for handling jobs of a specific type.
	 *
	 * During each polling interval, the queue will check for eligible jobs
	 * for each registered processor and dispatch them accordingly.
	 *
	 * If no processors are registered, the queue will not process any jobs.
	 */
	processors: Processor[];

	/**
	 * Job execution polling interval in milliseconds.
	 *
	 * @default 1000
	 */
	pollIntervalMs?: number;
};

/**
 * A lightweight, job queue for single-instance applications.
 * Handles job scheduling, retry logic, and processor dispatch.
 *
 * It doesn't handle distributed locking or multi-instance coordination and should not
 * be used in environments where multiple instances may process the same jobs concurrently.
 */
export class Queue extends EventEmitter {
	private readonly processors: Processor[] = [];
	private readonly pollInterval: number;
	private readonly jobRuns: Map<JobRecord["runId"], JobRun> = new Map();

	private intervalId?: NodeJS.Timeout;

	get running(): boolean {
		return !!this.intervalId;
	}

	constructor(
		private readonly deps: Deps,
		options: Opts,
	) {
		super();
		this.pollInterval = options.pollIntervalMs ?? 1000;
		this.processors = [...options.processors];
	}

	override on<TData, TResult>(event: QueueEvents.Added, listener: (job: JobRecord<TData, TResult>) => void): this;
	override on<TData, TResult>(event: QueueEvents.Cancelled, listener: (job: JobRecord<TData, TResult>) => void): this;
	override on<TData, TResult>(
		event: QueueEvents.Failed,
		listener: (failedJob: JobRecord<TData, TResult>, rescheduledJob: JobRecord<TData, TResult>) => void,
	): this;
	override on<TData, TResult>(event: QueueEvents.Succeeded, listener: (job: JobRecord<TData, TResult>) => void): this;
	override on<TData, TResult>(event: QueueEvents.Progress, listener: (job: JobRecord<TData, TResult>) => void): this;
	override on(event: QueueEvents.Start, listener: () => void): this;
	override on(event: QueueEvents.Stop, listener: () => void): this;

	override on(event: string, listener: (...args: any[]) => void): this {
		return super.on(event, listener);
	}

	// --- Public CRUD API ---

	add<TData>(
		name: string,
		data: TData,
		initialState: JobState.Pending | JobState.Waiting = JobState.Waiting,
	): JobRecord {
		const job = this.deps.jobRecordRepository.create({
			processorName: name,
			jobData: data,
			initialState,
		});

		logger.info(`Added new job to queue: ${humanizeJobRecord(job)}`);

		this.emit(QueueEvents.Added, job);

		return job;
	}

	moveFromPendingToWaiting(runId: JobRecord["runId"]): void {
		const latestRecord = this.deps.jobRecordRepository.findByRunId(runId);
		assert.ok(latestRecord, `JobRecord with runId ${runId} not found.`);
		assert.ok(latestRecord.state === JobState.Pending, `JobRecord with runId ${runId} is not in Pending state.`);

		this.deps.jobRecordRepository.markWaitingForRunId(runId);
	}

	cancel(job: JobRecord): void {
		const activeRun = this.jobRuns.get(job.runId);
		if (activeRun) {
			logger.info(`Cancelling active job run: ${humanizeJobRecord(job)}`);
			activeRun.abort();
		}

		this.deps.jobRecordRepository.markCancelledForRunId(job.runId);
		const updatedRecord = this.deps.jobRecordRepository.findByRunId(job.runId);
		if (!updatedRecord) {
			logger.warn("Cannot emit cancelled event. JobRecord not found for runId:", job.runId);
			return;
		}

		this.emit(QueueEvents.Cancelled, updatedRecord);
	}

	getByRunId(runId: JobRecord["runId"]): JobRecord | undefined {
		return this.deps.jobRecordRepository.findByRunId(runId);
	}

	getAllByJobId(jobId: JobRecord["jobId"]): JobRecord[] {
		return this.deps.jobRecordRepository.findAllByJobId(jobId);
	}

	getLatestByJobId(jobId: JobRecord["jobId"]): JobRecord | undefined {
		return this.deps.jobRecordRepository.findLatestByJobId(jobId);
	}

	getAllForProcessor(name: string): JobRecord[] {
		return this.deps.jobRecordRepository.findAllForProcessor(name);
	}

	// --- Queue Management API ---

	start() {
		this.intervalId = setInterval(() => this.runOnce(), this.pollInterval);
		this.emit(QueueEvents.Start);
	}

	stop() {
		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = undefined;
			this.emit(QueueEvents.Stop);
		}
	}

	// --- Private ---

	private runOnce(): void {
		logger.trace("Running job queue iteration");
		this.reconcile();

		logger.trace("Running job queue iteration");
		for (const processor of this.processors) {
			logger.trace(`Checking for eligible jobs for processor: ${processor.name}`);

			if (this.jobRuns.has(processor.name)) {
				logger.trace(`Processor ${processor.name} is already running a job. Skipping.`);
				continue;
			}

			logger.trace("Looking for next eligible job");
			const jobs = this.deps.jobRecordRepository.findAllInState([JobState.Waiting], {
				processorName: processor.name,
				limit: 1,
			});

			if (jobs.length === 0) {
				logger.trace(`No eligible jobs found for processor ${processor.name}.`);
			}

			for (const jobRecord of jobs) {
				logger.info(`Found eligible job. Dispatching for processing: ${humanizeJobRecord(jobRecord)}`);
				this.runJob(jobRecord, processor).then(
					() => {
						logger.info(`Job processed successfully: ${humanizeJobRecord(jobRecord)}`);
					},
					(err) => {
						logger.error(`Error processing job: ${humanizeJobRecord(jobRecord)}:`, err);
					},
				);
			}
		}
	}

	private reconcile(): void {
		logger.trace("Reconciling running jobs");
		const running = this.deps.jobRecordRepository.findAllInState([JobState.Running]);
		logger.trace(`Found ${running.length} running jobs to reconcile.`);
		for (const jobRecord of running) {
			logger.trace(`Reconciling running Job: ${humanizeJobRecord(jobRecord)}`);
			const jobRun = this.jobRuns.get(jobRecord.runId);
			if (!jobRun) {
				logger.warn(`Run is marked as running but no active JobRun found for job: ${humanizeJobRecord(jobRecord)}`);

				logger.trace(`Marking job as failed for missing JobRun: ${humanizeJobRecord(jobRecord)}`);

				this.fail(jobRecord.runId, JobErrorCode.JobRunNotFound, "No active JobRun found for job");
			} else {
				logger.trace(`Run has an active JobRun. No action needed: ${humanizeJobRecord(jobRecord)}`);
			}
		}
	}

	private async runJob<TData, TResult>(
		jobRecord: JobRecord<TData, TResult>,
		processor: Processor<TData, TResult>,
	): Promise<void> {
		logger.trace(`Running job: ${humanizeJobRecord(jobRecord)}`);
		const jobRun = new JobRun<TData, TResult>(jobRecord, processor);

		logger.trace(`Setting active JobRun for job: ${humanizeJobRecord(jobRecord)}`);
		this.jobRuns.set(jobRecord.runId, jobRun);

		logger.trace(`Saving initial run state to repository: ${humanizeJobRecord(jobRecord)}`);
		this.deps.jobRecordRepository.markRunningForRunId(jobRecord.runId);

		logger.trace(`Calling process on JobRun for job: ${humanizeJobRecord(jobRecord)}`);
		await jobRun.process({
			onProgress: (progress: number) => {
				logger.trace(`Updating job progress: ${humanizeJobRecord(jobRecord)}`);
				this.updateProgress(jobRecord.runId, progress);
			},
			onSuccess: (result) => {
				logger.trace(`OnSuccess called for job:${humanizeJobRecord(jobRecord)}`);
				this.succeed(jobRecord.runId, result);
			},
			onFailed: (errorCode, errorMessage) => {
				logger.trace(`OnFailed called for job ${humanizeJobRecord(jobRecord)}`);
				this.fail(jobRecord.runId, errorCode, errorMessage);
			},
		});

		logger.trace(`Clearing active JobRun for job: ${humanizeJobRecord(jobRecord)}`);
		this.jobRuns.delete(jobRecord.runId);
	}

	private fail(runId: JobRecord["runId"], errorCode: JobErrorCode, errorMessage: string) {
		this.deps.jobRecordRepository.markFailedForRunId(runId, errorCode, errorMessage);

		const existingRun = this.deps.jobRecordRepository.findByRunId(runId);
		if (!existingRun) {
			logger.warn("Cannot reschedule job. JobRecord not found for runId:", runId);
			return;
		}

		const newRun = this.deps.jobRecordRepository.create({
			jobId: existingRun.jobId,
			processorName: existingRun.processorName,
			jobData: existingRun.jobData,
			initialState: JobState.Waiting,
		});

		this.emit(QueueEvents.Failed, existingRun, newRun);
	}

	private succeed(runId: JobRecord["runId"], result: any) {
		this.deps.jobRecordRepository.markSuccessForRunId(runId, result);
		const updatedRecord = this.deps.jobRecordRepository.findByRunId(runId);
		if (!updatedRecord) {
			logger.warn("Cannot emit succeeded event. JobRecord not found for runId:", runId);
			return;
		}

		this.emit(QueueEvents.Succeeded, updatedRecord);
	}

	private updateProgress(runId: JobRecord["runId"], progress: number) {
		this.deps.jobRecordRepository.updateProgressForRunId(runId, progress);
		const updatedRecord = this.deps.jobRecordRepository.findByRunId(runId);
		if (!updatedRecord) {
			logger.warn("Cannot emit progress event. JobRecord not found for runId:", runId);
			return;
		}

		this.emit(QueueEvents.Progress, updatedRecord);
	}
}
