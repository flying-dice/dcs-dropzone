import type { RunState } from "./RunState.ts";

/**
 * Represents one execution attempt of a job.
 * Runs can succeed or fail, and store the final output.
 */
export type Run<TResult = unknown> = {
	id: string;
	jobId: string;
	attempt: number;
	state: RunState;
	startedAt: Date;
	endedAt?: Date;
	result?: TResult;
	error?: string;
};
