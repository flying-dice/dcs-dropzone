import type { Job } from "../Job.ts";

/**
 * Port for job persistence.
 */
export type JobRepo = {
	/**
	 * Create a new job.
	 */
	create: (job: Job) => Promise<Job>;

	/**
	 * Find a job by ID.
	 */
	findById: (id: string) => Promise<Job | undefined>;

	/**
	 * Find the next eligible job (completedAt IS NULL AND scheduledAt <= now),
	 * ordered by earliest scheduledAt.
	 */
	findNextEligible: (queues: string[]) => Promise<Job | undefined>;

	/**
	 * Update a job.
	 */
	update: (job: Job) => Promise<Job>;

	/**
	 * Update job progress.
	 */
	updateProgress: (id: string, progress: unknown, progressUpdatedAt: Date) => Promise<void>;

	/**
	 * List all jobs, optionally filtered by queue.
	 */
	list: (queue?: string) => Promise<Job[]>;

	/**
	 * List pending jobs (not completed).
	 */
	listPending: (queue?: string) => Promise<Job[]>;

	/**
	 * List completed jobs.
	 */
	listCompleted: (queue?: string) => Promise<Job[]>;
};
