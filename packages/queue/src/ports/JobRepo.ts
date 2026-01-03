import type { Job } from "../types.ts";

/**
 * Port for job persistence.
 */
export type JobRepo = {
	/**
	 * Save a job.
	 */
	save: (job: Job) => Promise<Job>;

	/**
	 * Find a job by ID.
	 */
	findById: (id: string) => Promise<Job | undefined>;

	/**
	 * Find the next eligible job (completedAt IS NULL AND scheduledAt <= now),
	 * ordered by earliest scheduledAt.
	 *
	 * It must not have an active run.
	 */
	findNextEligible: (queues: string) => Promise<Job | undefined>;

	/**
	 * Update job progress (0-100).
	 */
	updateProgress: (id: string, progress: number, progressUpdatedAt: Date) => Promise<void>;

	/**
	 * Mark a job as completed.
	 */
	markCompleted: (id: string, completedAt: Date) => Promise<void>;

	/**
	 * Increment the attempts count for a job.
	 */
	incrementAttempts: (id: string) => Promise<number>;

	/**
	 * Reschedule a job to a new scheduledAt date.
	 */
	reschedule: (id: string, attempt: number, scheduledAt: Date) => Promise<void>;

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
