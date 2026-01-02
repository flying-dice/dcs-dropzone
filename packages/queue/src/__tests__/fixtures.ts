import { ExponentialBackoff, InMemoryJobRepo, InMemoryRunRepo } from "../adapters";
import type { Processor } from "../Processor.ts";
import { Queue } from "../Queue.ts";

export type TestQueueOptions = Partial<{
	jobRepo: InMemoryJobRepo;
	runRepo: InMemoryRunRepo;
	exponentCalculator: ExponentialBackoff;
	pollInterval: number;
}> & {
	processors?: Processor[];
};

/**
 * Create a test queue with in-memory adapters.
 */
export function createTestQueue(options: TestQueueOptions = {}): Queue {
	return new Queue(
		{
			jobRepo: options.jobRepo ?? new InMemoryJobRepo(),
			runRepo: options.runRepo ?? new InMemoryRunRepo(),
			exponentCalculator: options.exponentCalculator ?? new ExponentialBackoff({ baseDelayMs: 10 }),
		},
		{ processors: options.processors ?? [], pollInterval: options.pollInterval ?? 10 },
	);
}
