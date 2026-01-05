import * as assert from "node:assert";
import { InMemoryJobRecordRepository, type JobRecord, JobState, type Processor, Queue } from "../index.ts";

export type TestContext = {
	deps: { jobRecordRepository: InMemoryJobRecordRepository };
	build: () => Queue;
};

export function createTestContext(
	options: Partial<{
		jobRecordRepository: InMemoryJobRecordRepository;
		pollInterval: number;
	}> & {
		processors?: Processor[];
	} = {},
): TestContext {
	const jobRecordRepository = options.jobRecordRepository ?? new InMemoryJobRecordRepository();

	return {
		deps: { jobRecordRepository },
		build: () =>
			new Queue(
				{ jobRecordRepository },
				{
					processors: options.processors ?? [],
					pollIntervalMs: options.pollInterval ?? 10,
				},
			),
	};
}

/**
 * Wait for a job to be completed.
 */
export async function waitForJobFinish(
	c: TestContext,
	jobId: string,
	timeoutSeconds = 5,
): Promise<JobRecord[] | undefined> {
	const start = Date.now();
	const timeoutMs = timeoutSeconds * 1000;

	while (Date.now() - start < timeoutMs) {
		const jobs = c.deps.jobRecordRepository.findAllByJobId(jobId);
		assert.ok(jobs, `Jobs not found for Job ID ${jobId}`);
		if (jobs.every((job) => job.finishedAt)) {
			return jobs;
		}
		await delay(50);
	}

	throw new Error(`Timeout waiting for job with run id ${jobId} to complete`);
}

export async function waitForJobRunFinish(
	c: TestContext,
	runId: string,
	timeoutSeconds = 5,
): Promise<JobRecord | undefined> {
	const start = Date.now();
	const timeoutMs = timeoutSeconds * 1000;

	while (Date.now() - start < timeoutMs) {
		const job = c.deps.jobRecordRepository.findByRunId(runId);
		assert.ok(job, `Job not found for Run ID ${runId}`);
		if (job.finishedAt) {
			return job;
		}
		await delay(50);
	}

	throw new Error(`Timeout waiting for job with run id ${runId} to complete`);
}

export async function waitForJobRunStart(
	c: TestContext,
	runId: string,
	timeoutSeconds = 5,
): Promise<JobRecord | undefined> {
	const start = Date.now();
	const timeoutMs = timeoutSeconds * 1000;

	while (Date.now() - start < timeoutMs) {
		const job = c.deps.jobRecordRepository.findByRunId(runId);
		assert.ok(job, `Job not found for Run ID ${runId}`);
		if (job.startedAt) {
			return job;
		}
		await delay(50);
	}

	throw new Error(`Timeout waiting for job with run id ${runId} to start`);
}

/**
 * Wait for all pending jobs to be completed.
 */
export async function waitForAllJobsFinish(c: TestContext, timeoutSeconds = 5): Promise<void> {
	const start = Date.now();
	const timeoutMs = timeoutSeconds * 1000;

	while (Date.now() - start < timeoutMs) {
		if (c.deps.jobRecordRepository.findAllInState([JobState.Pending, JobState.Running]).length === 0) {
			return;
		}
		await delay(50);
	}

	throw new Error("Timeout waiting for all jobs to complete");
}

/**
 * Create a delay promise.
 */
export function delay(ms: number, signal?: AbortSignal): Promise<void> {
	return new Promise((resolve, reject) => {
		if (signal?.aborted) {
			reject(new DOMException("Aborted", "AbortError"));
			return;
		}

		const timeoutId = setTimeout(resolve, ms);

		signal?.addEventListener(
			"abort",
			() => {
				clearTimeout(timeoutId);
				reject(new DOMException("Aborted", "AbortError"));
			},
			{ once: true },
		);
	});
}
