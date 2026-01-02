import type { Job } from "./Job.ts";
import type { Processor } from "./Processor.ts";
import type { ProcessorContext } from "./ProcessorContext.ts";
import type { ExponentCalculator } from "./ports/ExponentCalculator.ts";
import type { JobRepo } from "./ports/JobRepo.ts";
import type { RunRepo } from "./ports/RunRepo.ts";
import type { Run } from "./Run.ts";

/**
 * Options for adding a job to the queue.
 */
export type AddJob<TData = unknown> = {
	queue: string;
	name: string;
	data: TData;
	scheduledAt?: Date;
};

type Deps = {
	jobRepo: JobRepo;
	runRepo: RunRepo;
	exponentCalculator: ExponentCalculator;
};

type Opts = {
	processors: Processor[];
	pollInterval?: number;
};

/**
 * A lightweight, job queue for single-instance applications.
 * Handles job scheduling, retry logic, and processor dispatch.
 *
 * It doesn't handle distributed locking or multi-instance coordination and should not
 * be used in environments where multiple instances may process the same jobs concurrently.
 */
export class Queue {
	private readonly processors: Map<string, Processor>;
	private readonly pollInterval: number;

	private isRunning = false;
	private pollTimeout: ReturnType<typeof setTimeout> | null = null;

	constructor(
		protected readonly deps: Deps,
		options: Opts,
	) {
		this.pollInterval = options.pollInterval ?? 1000;

		this.processors = new Map();
		for (const processor of options.processors) {
			const key = this.processorKey(processor.queue, processor.name);
			this.processors.set(key, processor);
		}
	}

	private processorKey(queue: string, name: string): string {
		return `${queue}:${name}`;
	}

	private getRegisteredQueues(): string[] {
		const queues = new Set<string>();
		for (const processor of this.processors.values()) {
			queues.add(processor.queue);
		}
		return Array.from(queues);
	}

	/**
	 * Add a job to the queue.
	 */
	async add<TData>(addJob: AddJob<TData>): Promise<Job<TData>> {
		const now = new Date();
		const job: Job<TData> = {
			id: crypto.randomUUID(),
			queue: addJob.queue,
			name: addJob.name,
			data: addJob.data,
			createdAt: now,
			scheduledAt: addJob.scheduledAt ?? now,
			attempts: 0,
		};

		return this.deps.jobRepo.create(job) as Promise<Job<TData>>;
	}

	/**
	 * Start processing jobs.
	 */
	start(): void {
		if (this.isRunning) {
			return;
		}

		this.isRunning = true;
		this.poll();
	}

	/**
	 * Stop processing jobs.
	 */
	stop(): void {
		this.isRunning = false;
		if (this.pollTimeout) {
			clearTimeout(this.pollTimeout);
			this.pollTimeout = null;
		}
	}

	/**
	 * Check if the queue is currently running.
	 */
	get running(): boolean {
		return this.isRunning;
	}

	private async poll(): Promise<void> {
		if (!this.isRunning) {
			return;
		}

		try {
			await this.processNext();
		} catch (error) {
			console.error("[Queue] Error in poll loop:", error);
		}

		if (this.isRunning) {
			this.pollTimeout = setTimeout(() => this.poll(), this.pollInterval);
		}
	}

	private async processNext(): Promise<void> {
		const queues = this.getRegisteredQueues();
		if (queues.length === 0) {
			return;
		}

		const job = await this.deps.jobRepo.findNextEligible(queues);
		if (!job) {
			return;
		}

		const processor = this.processors.get(this.processorKey(job.queue, job.name));
		if (!processor) {
			console.warn(`[Queue] No processor for job ${job.queue}:${job.name}`);
			return;
		}

		await this.executeJob(job, processor);
	}

	private async executeJob(job: Job, processor: Processor): Promise<void> {
		const run: Run = {
			id: crypto.randomUUID(),
			jobId: job.id,
			attempt: job.attempts + 1,
			state: "running",
			startedAt: new Date(),
		};

		await this.deps.runRepo.create(run);

		const updatedJob: Job = {
			...job,
			attempts: job.attempts + 1,
		};
		await this.deps.jobRepo.update(updatedJob);

		const ctx: ProcessorContext = {
			updateProgress: async (progress: unknown) => {
				await this.deps.jobRepo.updateProgress(job.id, progress, new Date());
			},
		};

		try {
			const result = await processor.process(updatedJob, ctx);

			run.state = "success";
			run.endedAt = new Date();
			run.result = result;
			await this.deps.runRepo.update(run);

			// Re-fetch the job to get any progress updates made during execution
			const currentJob = await this.deps.jobRepo.findById(job.id);
			if (currentJob) {
				currentJob.completedAt = new Date();
				await this.deps.jobRepo.update(currentJob);
			}
		} catch (error) {
			run.state = "failed";
			run.endedAt = new Date();
			run.error = error instanceof Error ? error.message : String(error);
			await this.deps.runRepo.update(run);

			// Re-fetch the job to get current state before rescheduling
			const currentJob = await this.deps.jobRepo.findById(job.id);
			if (currentJob) {
				currentJob.scheduledAt = this.deps.exponentCalculator.calculate(currentJob.attempts);
				await this.deps.jobRepo.update(currentJob);
			}
		}
	}

	// ============================================
	// Inspection Helpers
	// ============================================

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
}
