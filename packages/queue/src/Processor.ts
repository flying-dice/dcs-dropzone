import type { Result } from "neverthrow";

/**
 * Context passed to processor during job execution.
 */
export type ProcessorContext = {
	/**
	 * Update the progress of the current job (0-100).
	 */
	updateProgress: (progress: number) => void;

	/**
	 * AbortSignal to handle cancellation of the job processing.
	 */
	abortSignal: AbortSignal;
};

/**
 * A processor handles execution of jobs with a specific queue and name.
 */
export type Processor<TData = any, TResult = any> = {
	/** Name of the job the processor handles */
	name: string;

	/**
	 * Process a job.
	 *
	 * - Ok(result): Job completed successfully
	 * - Err(reason): Job failed with a known error reason
	 */
	process: (job: TData, ctx: ProcessorContext) => Promise<Result<TResult, string>>;
};
