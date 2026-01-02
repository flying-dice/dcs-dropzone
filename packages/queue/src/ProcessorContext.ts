/**
 * Context passed to processor during job execution.
 */
export type ProcessorContext<TProgress = unknown> = {
	/**
	 * Update the progress of the current job.
	 */
	updateProgress: (progress: TProgress) => Promise<void>;
};
