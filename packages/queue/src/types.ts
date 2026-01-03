import type { Result } from "neverthrow";

/**
 * Represents a unit of work intent.
 * Jobs never fail - they are completed only on successful execution.
 */
export type Job<TData = any> = {
	/**
	 * Name of the job type.
	 * Used to route to the correct processor.
	 */
	name: string;

	/**
	 * Unique identifier of the job.
	 */
	id: string;

	/**
	 * Payload data for the job.
	 */
	data: TData;

	/**
	 * Timestamp when the job was created.
	 */
	createdAt: Date;

	/**
	 * Timestamp when the job is scheduled to run.
	 */
	scheduledAt: Date;

	/**
	 * Timestamp when the job was completed.
	 */
	completedAt?: Date;

	/**
	 * Number of attempts made to process the job
	 * This is only incremented when a job run finishes with Success or Failed state.
	 */
	attempts: number;

	/**
	 * Progress percentage (0-100)
	 */
	progress?: number;
	progressUpdatedAt?: Date;
};

export enum RunState {
	Running = "running",
	Success = "success",
	Failed = "failed",
}

export enum RunErrorCode {
	ProcessorError = "PROCESSOR_ERROR",
	JobRunNotFound = "JOB_RUN_NOT_FOUND",
}

/**
 * Represents one execution attempt of a job.
 * Runs can succeed or fail, and store the final output.
 */
export type Run<TResult = any> = {
	readonly id: string;
	readonly jobId: string;
	readonly jobName: string;
	readonly attempt: number;
	state: RunState;
	readonly startedAt: Date;
	endedAt?: Date;
	result?: TResult;
	error?: {
		code: RunErrorCode;
		message: string;
	};
};

/**
 * Context passed to processor during job execution.
 */
export type ProcessorContext = {
	/**
	 * Update the progress of the current job (0-100).
	 */
	updateProgress: (progress: number) => Promise<void>;

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
