import type { Run } from "../Run.ts";

/**
 * Port for run persistence.
 */
export type RunRepo = {
	/**
	 * Create a new run.
	 */
	create: (run: Run) => Promise<Run>;

	/**
	 * Find a run by ID.
	 */
	findById: (id: string) => Promise<Run | undefined>;

	/**
	 * Update a run.
	 */
	update: (run: Run) => Promise<Run>;

	/**
	 * Get the latest run for a job.
	 */
	findLatestByJobId: (jobId: string) => Promise<Run | undefined>;

	/**
	 * List all runs for a job.
	 */
	listByJobId: (jobId: string) => Promise<Run[]>;

	/**
	 * List all failed runs.
	 */
	listFailed: () => Promise<Run[]>;
};
