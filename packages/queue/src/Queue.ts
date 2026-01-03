import { getLogger } from "log4js";
import { JobRun } from "./JobRun.ts";
import type { ExponentCalculator } from "./ports/ExponentCalculator.ts";
import type { JobRepo } from "./ports/JobRepo.ts";
import type { RunRepo } from "./ports/RunRepo.ts";
import { type Job, type Processor, type Run, RunErrorCode, RunState } from "./types.ts";

const logger = getLogger("Queue");

type Deps = {
	jobRepo: JobRepo;
	runRepo: RunRepo;
	exponentCalculator: ExponentCalculator;
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
export class Queue {
	private readonly processors: Processor[] = [];
	private readonly pollInterval: number;
	private readonly jobRuns: Map<string, JobRun> = new Map();

	private intervalId?: NodeJS.Timeout;

	get running(): boolean {
		return !!this.intervalId;
	}

	constructor(
		public readonly deps: Deps,
		options: Opts,
	) {
		this.pollInterval = options.pollIntervalMs ?? 1000;
		this.processors = [...options.processors];
	}

	start() {
		this.intervalId = setInterval(() => this.runOnce(), this.pollInterval);
	}

	stop() {
		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = undefined;
		}
	}

	async runOnce(): Promise<void> {
		logger.trace("Running job queue iteration");
		await this.reconcile();

		logger.trace("Running job queue iteration");
		for (const processor of this.processors) {
			logger.trace(`Checking for eligible jobs for processor: ${processor.name}`);

			if (this.jobRuns.has(processor.name)) {
				logger.trace(`Processor ${processor.name} is already running a job. Skipping.`);
				continue;
			}

			logger.trace("Looking for next eligible job");
			const job = await this.deps.jobRepo.findNextEligible(processor.name);
			if (job) {
				logger.info(`Found eligible job ${job.id} for processor ${processor.name}. Dispatching for processing.`);
				this.runJob(job, processor).then(
					() => {
						logger.info(`Job ${job.id} processed successfully.`);
					},
					(err) => {
						logger.error(`Error processing job ${job.id}:`, err);
					},
				);
			} else {
				logger.trace(`No eligible jobs found for processor ${processor.name}.`);
			}
		}
	}

	async reconcile(): Promise<void> {
		logger.trace("Reconciling running jobs");
		const running = await this.deps.runRepo.listRunning();
		logger.trace(`Found ${running.length} running jobs to reconcile.`);
		for (const run of running) {
			logger.trace("Reconciling running job:", run.id);
			const jobRun = this.jobRuns.get(run.jobName);
			if (!jobRun) {
				logger.warn(`Run ${run.id} is marked as running but no active JobRun found for job ${run.jobName}.`);
				const newState = {
					...run,
					state: RunState.Failed,
					error: {
						code: RunErrorCode.JobRunNotFound,
						message: `No active JobRun found for job ${run.jobName}.`,
					},
				};
				logger.trace("Setting run state to Failed due to missing JobRun:", newState);
				await this.deps.runRepo.save(newState);

				logger.trace("Incrementing attempts and rescheduling job:", run.jobId);
				const attempts = await this.deps.jobRepo.incrementAttempts(run.jobId);
				await this.deps.jobRepo.reschedule(run.jobId, attempts, this.deps.exponentCalculator.calculate(attempts));
			} else {
				logger.trace(`Run ${run.id} has an active JobRun. No action needed.`);
			}
		}
	}

	/**
	 * Add a job to the queue.
	 */
	async add<TData>(name: string, data: TData, scheduledAt?: Date): Promise<string> {
		const now = new Date();
		const id = crypto.randomUUID();
		const job: Job<TData> = {
			id,
			name,
			data,
			createdAt: now,
			scheduledAt: scheduledAt ?? now,
			attempts: 0,
		};

		await this.deps.jobRepo.save(job);
		return id;
	}

	/**
	 * Get a job by ID.
	 */
	async getJob(id: string): Promise<Job | undefined> {
		return this.deps.jobRepo.findById(id);
	}

	/**
	 * Get a run by ID.
	 */
	async getRun(id: string): Promise<Run | undefined> {
		return this.deps.runRepo.findById(id);
	}

	/**
	 * Get the latest run for a job.
	 */
	async getLatestRun(jobId: string): Promise<Run | undefined> {
		return this.deps.runRepo.findLatestByJobId(jobId);
	}

	/**
	 * Get all runs for a job.
	 */
	async getJobRuns(jobId: string): Promise<Run[]> {
		return this.deps.runRepo.listByJobId(jobId);
	}

	/**
	 * List all jobs, optionally filtered by queue.
	 */
	async listJobs(queue?: string): Promise<Job[]> {
		return this.deps.jobRepo.list(queue);
	}

	/**
	 * List pending jobs (not completed).
	 */
	async listPendingJobs(queue?: string): Promise<Job[]> {
		return this.deps.jobRepo.listPending(queue);
	}

	/**
	 * List completed jobs.
	 */
	async listCompletedJobs(queue?: string): Promise<Job[]> {
		return this.deps.jobRepo.listCompleted(queue);
	}

	/**
	 * List all failed runs (error log).
	 */
	async listFailedRuns(): Promise<Run[]> {
		return this.deps.runRepo.listFailed();
	}

	private async runJob<TData, TResult>(job: Job<TData>, processor: Processor<TData, TResult>): Promise<void> {
		logger.trace(`Running job ${job.id}, creating JobRun instance.`);
		const jobRun = new JobRun<TData, TResult>(job, processor);

		logger.trace("Setting active JobRun for job:", job.name);
		this.jobRuns.set(job.name, jobRun);

		logger.trace("Saving initial run state to repository.", jobRun.run);
		await this.deps.runRepo.save(jobRun.run);

		logger.trace(`Calling process on JobRun ${jobRun.run.id}`);
		await jobRun.process({
			onProgress: async (progress: number) => {
				logger.trace("Updating job progress:", job.id, progress);
				await this.deps.jobRepo.updateProgress(job.id, progress, new Date());
			},
			onSuccess: async () => {
				logger.trace("OnSuccess called for job:", job.id);
				await this.deps.jobRepo.incrementAttempts(job.id);
				await this.deps.jobRepo.markCompleted(job.id, new Date());
			},
			onFailed: async () => {
				logger.trace("OnFailed called for job:", job.id);
				const currentAttempts = await this.deps.jobRepo.incrementAttempts(job.id);
				await this.deps.jobRepo.reschedule(
					job.id,
					currentAttempts,
					this.deps.exponentCalculator.calculate(currentAttempts),
				);
			},
		});

		logger.trace("Clearing active JobRun for job:", job.name);
		this.jobRuns.delete(job.name);

		logger.trace("Saving final run state to repository.", jobRun.run);
		await this.deps.runRepo.save(jobRun.run);
	}
}
