import type { Result } from "neverthrow";
import { ExponentialBackoff, InMemoryJobRepo, InMemoryRunRepo } from "../adapters";
import { Queue } from "../Queue.ts";
import type { Processor, ProcessorContext } from "../types.ts";

export type TestQueueOptions = Partial<{
	jobRepo: InMemoryJobRepo;
	runRepo: InMemoryRunRepo;
	exponentCalculator: ExponentialBackoff;
	pollInterval: number;
}> & {
	processors?: Processor[];
};

export type CreateProcessorOptions<TData = any, TResult = any> = {
	name: string;
	process: (job: TData, ctx: ProcessorContext) => Promise<Result<TResult, string>>;
};

/**
 * Create a processor with a default reconcile that always returns ok (still running).
 */
export function createProcessor<TData = any, TResult = any>(
	options: CreateProcessorOptions<TData, TResult>,
): Processor<TData, TResult> {
	return {
		name: options.name,
		process: options.process,
	};
}

/**
 * Create a test queue with in-memory adapters.
 */
export function createTestQueue(options: TestQueueOptions = {}): Queue {
	const runRepo = options.runRepo ?? new InMemoryRunRepo();
	const jobRepo = options.jobRepo ?? new InMemoryJobRepo(runRepo);
	const exponentCalculator = options.exponentCalculator ?? new ExponentialBackoff({ baseDelayMs: 10 });

	return new Queue(
		{ jobRepo, runRepo, exponentCalculator },
		{
			processors: options.processors ?? [],
			pollIntervalMs: options.pollInterval ?? 10,
		},
	);
}

/**
 * Create a test queue and return it along with its repos for direct manipulation.
 */
export function createTestQueueWithRepos(options: TestQueueOptions = {}) {
	const runRepo = options.runRepo ?? new InMemoryRunRepo();
	const jobRepo = options.jobRepo ?? new InMemoryJobRepo(runRepo);
	const exponentCalculator = options.exponentCalculator ?? new ExponentialBackoff({ baseDelayMs: 10 });

	const queue = new Queue(
		{ jobRepo, runRepo, exponentCalculator },
		{
			processors: options.processors ?? [],
			pollIntervalMs: options.pollInterval ?? 10,
		},
	);

	return { queue, jobRepo, runRepo, exponentCalculator };
}
