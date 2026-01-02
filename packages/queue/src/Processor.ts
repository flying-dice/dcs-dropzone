import type { Job } from "./Job.ts";
import type { ProcessorContext } from "./ProcessorContext.ts";

/**
 * A processor handles execution of jobs with a specific queue and name.
 */
export type Processor<TData = unknown, TResult = unknown, TProgress = unknown> = {
	queue: string;
	name: string;
	process: (job: Job<TData, TProgress>, ctx: ProcessorContext<TProgress>) => Promise<TResult>;
};
