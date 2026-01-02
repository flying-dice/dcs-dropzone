import type { Job, Queue } from "../index.ts";

/**
 * Wait for a job to be completed.
 */
export async function waitForJobCompletion(queue: Queue, jobId: string, timeoutSeconds = 5): Promise<Job | undefined> {
	const start = Date.now();
	const timeoutMs = timeoutSeconds * 1000;

	while (Date.now() - start < timeoutMs) {
		const job = await queue.getJob(jobId);
		if (job?.completedAt) {
			return job;
		}
		await new Promise((resolve) => setTimeout(resolve, 50));
	}

	throw new Error(`Timeout waiting for job ${jobId} to complete`);
}

/**
 * Wait for all pending jobs to be completed.
 */
export async function waitForAllJobsCompleted(queue: Queue, timeoutSeconds = 5): Promise<void> {
	const start = Date.now();
	const timeoutMs = timeoutSeconds * 1000;

	while (Date.now() - start < timeoutMs) {
		const pending = await queue.listPendingJobs();
		if (pending.length === 0) {
			return;
		}
		await new Promise((resolve) => setTimeout(resolve, 50));
	}

	throw new Error("Timeout waiting for all jobs to complete");
}

/**
 * Create a delay promise.
 */
export function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
