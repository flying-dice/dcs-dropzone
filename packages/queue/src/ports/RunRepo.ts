import type { Run } from "../types.ts";

/**
 * Port for run persistence.
 */
export type RunRepo = {
	/**
	 * Find a run by ID.
	 */
	findById: (id: string) => Promise<Run | undefined>;

	/**
	 * Save a run.
	 */
	save: (run: Run) => Promise<Run>;

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

	/**
	 * List all runs with state='running'.
	 */
	listRunning: () => Promise<Run[]>;

	/**
	 * List all runs with state='success'.
	 */
	listSuccess: () => Promise<Run[]>;
};
