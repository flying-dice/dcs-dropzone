import { describe, expect, it } from "bun:test";
import assert from "node:assert";
import { err, ok } from "neverthrow";
import { ExponentialBackoff } from "../adapters";
import { RunErrorCode, RunState } from "../types.ts";
import { createProcessor, createTestQueue } from "./fixtures.ts";
import { delay, waitForAllJobsCompleted, waitForJobCompletion } from "./utils.ts";

describe("Queue", () => {
	describe("add", () => {
		it("should add a job with default scheduledAt", async () => {
			const queue = createTestQueue();

			await queue.add("test", { foo: "bar" });

			const jobs = await queue.listJobs("test");
			expect(jobs.length).toBe(1);
			const job = jobs[0]!;

			expect(job.id).toBeDefined();
			expect(job.name).toBe("test");
			expect(job.data).toEqual({ foo: "bar" });
			expect(job.attempts).toBe(0);
			expect(job.createdAt).toBeInstanceOf(Date);
			expect(job.scheduledAt).toEqual(job.createdAt);
			expect(job.completedAt).toBeUndefined();
		});

		it("should add a job with custom scheduledAt", async () => {
			const queue = createTestQueue();

			const futureDate = new Date(Date.now() + 60000);

			await queue.add("test", { foo: "baz" }, futureDate);

			const jobs = await queue.listJobs("test");
			expect(jobs.length).toBe(1);
			const job = jobs[0]!;

			expect(job.scheduledAt).toEqual(futureDate);
		});
	});

	describe("job execution", () => {
		it("should execute a job when eligible", async () => {
			type JobData = { value: number };
			let processedData: JobData | undefined;

			const processor = createProcessor<JobData, string>({
				name: "test",
				process: async (data) => {
					processedData = data;
					return ok("done");
				},
			});

			const queue = createTestQueue({ processors: [processor] });

			const jobId = await queue.add("test", { value: 42 });

			expect(processedData).toBeUndefined();

			queue.start();
			await waitForJobCompletion(queue, jobId);
			queue.stop();

			expect(processedData).toBeDefined();
			expect(processedData).toEqual({ value: 42 });

			const completedJobs = await queue.listCompletedJobs();
			const run = await queue.getLatestRun(jobId);
			expect(completedJobs.length).toBe(1);
			expect(completedJobs[0]).toMatchObject({
				id: expect.any(String),
				name: "test",
				data: { value: 42 },
				attempts: 1,
				createdAt: expect.any(Date),
				scheduledAt: expect.any(Date),
				completedAt: expect.any(Date),
			});
			expect(run).toMatchObject({
				id: expect.any(String),
				jobId: jobId,
				state: RunState.Success,
				attempt: 1,
				startedAt: expect.any(Date),
				endedAt: expect.any(Date),
				result: "done",
			});
		});

		it("should not execute a job scheduled in the future", async () => {
			let processed = false;

			const processor = createProcessor({
				name: "test",
				process: async () => {
					processed = true;
					return ok("done");
				},
			});

			const queue = createTestQueue({ processors: [processor] });

			await queue.add("test", {}, new Date(Date.now() + 60000));

			queue.start();
			await delay(100);
			queue.stop();

			expect(processed).toBe(false);
			const pendingJobs = await queue.listPendingJobs();
			expect(pendingJobs.length).toBe(1);
			expect(pendingJobs[0]).toMatchObject({
				id: expect.any(String),
				name: "test",
				attempts: 0,
				data: {},
				createdAt: expect.any(Date),
				scheduledAt: expect.any(Date),
			});
			expect(pendingJobs[0]?.completedAt).toBeUndefined();
		});

		it("should process jobs in scheduledAt order", async () => {
			const processedOrder: string[] = [];

			const processor = createProcessor<string, string>({
				name: "test",
				process: async (payload) => {
					processedOrder.push(payload);
					return ok(payload);
				},
			});

			const queue = createTestQueue({ processors: [processor] });

			const now = Date.now();
			await queue.add("test", "third", new Date(now + 20));
			await queue.add("test", "first", new Date(now - 20));
			await queue.add("test", "second", new Date(now));

			queue.start();
			await waitForAllJobsCompleted(queue);
			queue.stop();

			expect(processedOrder).toEqual(["first", "second", "third"]);

			const allRuns = await queue.deps.runRepo.listSuccess();
			expect(allRuns.length).toBe(3);
			expect(allRuns.map((it) => it.result)).toEqual(["first", "second", "third"]);
		});
	});

	describe("retry behavior", () => {
		it("should reschedule a job on failure and complete after retries", async () => {
			const failCount = 2;
			let attempts = 0;

			const processor = createProcessor({
				name: "test",
				process: async () => {
					attempts++;
					if (attempts <= failCount) {
						return err(`Simulated failure (attempt ${attempts})`);
					}
					return ok("success");
				},
			});

			const queue = createTestQueue({
				processors: [processor],
				exponentCalculator: new ExponentialBackoff({ baseDelayMs: 10 }),
			});

			const jobId = await queue.add("test", {});

			queue.start();
			await waitForJobCompletion(queue, jobId, 10);
			queue.stop();

			expect(attempts).toBe(3);

			const updatedJob = await queue.getJob(jobId);
			expect(updatedJob?.attempts).toBe(3);
			expect(updatedJob?.completedAt).toBeInstanceOf(Date);

			const runs = await queue.getJobRuns(jobId);
			expect(runs.length).toBe(3);
			expect(runs[0]).toMatchObject({
				id: expect.any(String),
				jobId: jobId,
				state: RunState.Failed,
				attempt: 1,
				startedAt: expect.any(Date),
				endedAt: expect.any(Date),
				error: { code: RunErrorCode.ProcessorError, message: "Simulated failure (attempt 1)" },
			});
			expect(runs[1]).toMatchObject({
				id: expect.any(String),
				jobId: jobId,
				state: RunState.Failed,
				attempt: 2,
				startedAt: expect.any(Date),
				endedAt: expect.any(Date),
				error: { code: RunErrorCode.ProcessorError, message: "Simulated failure (attempt 2)" },
			});
			expect(runs[2]).toMatchObject({
				id: expect.any(String),
				jobId: jobId,
				state: RunState.Success,
				attempt: 3,
				startedAt: expect.any(Date),
				endedAt: expect.any(Date),
				result: "success",
			});
		});
		it("should store error message on failed run", async () => {
			const processor = createProcessor({
				name: "test",
				process: async () => {
					return err("Something went wrong");
				},
			});

			const queue = createTestQueue({
				processors: [processor],
				exponentCalculator: new ExponentialBackoff({ baseDelayMs: 10000 }),
			});

			const jobId = await queue.add("test", {});

			queue.start();
			await delay(100);
			queue.stop();

			const failedRuns = await queue.listFailedRuns();
			expect(failedRuns.length).toBe(1);
			expect(failedRuns[0]?.error).toEqual({
				code: RunErrorCode.ProcessorError,
				message: "Something went wrong",
			});
			expect(failedRuns[0]?.jobId).toBe(jobId);
		});
	});
	describe("progress tracking", () => {
		it("should save job progress during execution", async () => {
			const progressUpdates: number[] = [];
			const progressSteps = [25, 50, 75, 100];

			const processor = createProcessor({
				name: "test",
				process: async (_job, ctx) => {
					for (const step of progressSteps) {
						progressUpdates.push(step);
						await ctx.updateProgress(step);
					}
					return ok("done");
				},
			});
			const queue = createTestQueue({ processors: [processor] });

			const jobId = await queue.add("test", {});

			queue.start();
			await waitForJobCompletion(queue, jobId);
			queue.stop();

			const updatedJob = await queue.getJob(jobId);
			expect(updatedJob?.progress).toBe(100);
			expect(updatedJob?.progressUpdatedAt).toBeInstanceOf(Date);
			expect(progressUpdates).toEqual(progressSteps);
		});

		it("should preserve progress across retries", async () => {
			let attempt = 0;

			const processor = createProcessor({
				name: "test",
				process: async (_job, ctx) => {
					attempt++;
					await ctx.updateProgress(attempt * 25);
					if (attempt < 2) {
						return err("Fail first time");
					}
					return ok("success");
				},
			});

			const queue = createTestQueue({
				processors: [processor],
				exponentCalculator: new ExponentialBackoff({ baseDelayMs: 10 }),
			});

			const jobId = await queue.add("test", {});

			queue.start();
			await waitForJobCompletion(queue, jobId);
			queue.stop();

			const updatedJob = await queue.getJob(jobId);
			expect(updatedJob?.progress).toBe(50);
		});
	});

	describe("start/stop", () => {
		it("should track running state", () => {
			const queue = createTestQueue();

			expect(queue.running).toBe(false);
			queue.start();
			expect(queue.running).toBe(true);
			queue.stop();
			expect(queue.running).toBe(false);
		});

		it("should not start twice", () => {
			const queue = createTestQueue();

			queue.start();
			queue.start();
			expect(queue.running).toBe(true);
			queue.stop();
		});

		it("should stop processing when stopped", async () => {
			let processCount = 0;

			const processor = createProcessor({
				name: "test",
				process: async () => {
					processCount++;
					return ok("done");
				},
			});

			const queue = createTestQueue({ processors: [processor] });

			await queue.add("test", {});

			queue.start();
			await delay(50);
			queue.stop();

			const countAfterStop = processCount;
			await delay(100);

			expect(processCount).toBe(countAfterStop);
		});
	});

	describe("multiple processors", () => {
		it("should dispatch to correct processor based on queue and name", async () => {
			const results: string[] = [];

			const processorA = createProcessor({
				name: "queueA",
				process: async () => {
					results.push("A");
					return ok("A");
				},
			});

			const processorB = createProcessor({
				name: "queueB",
				process: async () => {
					results.push("B");
					return ok("B");
				},
			});

			const queue = createTestQueue({ processors: [processorA, processorB] });

			await queue.add("queueA", {});
			await queue.add("queueB", {});

			queue.start();
			await waitForAllJobsCompleted(queue);
			queue.stop();

			expect(results.sort()).toEqual(["A", "B"]);
		});

		it("should not process jobs without a matching processor", async () => {
			const processor = createProcessor({
				name: "test",
				process: async () => {
					return ok("done");
				},
			});
			const queue = createTestQueue({ processors: [processor] });

			const now = Date.now();
			// Schedule unknownJob later so knownJob gets processed first
			const jobWithoutProcessorId = await queue.add("test_noproc", {}, new Date(now + 10));
			const jobWithProcessorId = await queue.add("test", {}, new Date(now - 10));

			queue.start();
			await delay(100);
			queue.stop();

			const completed = await queue.listCompletedJobs();
			const pending = await queue.listPendingJobs();

			expect(completed.length).toBe(1);
			expect(completed[0]?.id).toBe(jobWithProcessorId);
			expect(pending.length).toBe(1);
			expect(pending[0]?.id).toBe(jobWithoutProcessorId);
		});
	});

	describe("Reconciliation", () => {
		it("should reconcile stuck runs when job-run is not found in memory", async () => {
			const processor = createProcessor({
				name: "test",
				process: async () => {
					return ok("done");
				},
			});

			const queue = createTestQueue({ processors: [processor] });

			const jobId = await queue.add("test", {});

			await queue.deps.runRepo.save({
				id: "fake-run-1",
				jobId: jobId,
				attempt: 1,
				state: RunState.Running,
				startedAt: new Date(Date.now() - 60000), // started 60s ago
				jobName: "test",
			});

			queue.start();
			await waitForJobCompletion(queue, jobId);
			queue.stop();

			const jobs = await queue.listJobs();
			const failedRuns = await queue.deps.runRepo.listFailed();
			const successfulRuns = await queue.deps.runRepo.listSuccess();

			expect(jobs.length).toBe(1);
			expect(jobs[0]).toMatchObject({
				id: jobId,
				name: "test",
				attempts: 2,
				data: {},
				completedAt: expect.any(Date),
			});

			expect(failedRuns.length).toBe(1);
			expect(failedRuns[0]).toMatchObject({
				id: "fake-run-1",
				jobId: jobId,
				attempt: 1,
				state: RunState.Failed,
				error: {
					code: RunErrorCode.JobRunNotFound,
					message: "No active JobRun found for job test.",
				},
			});

			expect(successfulRuns.length).toBe(1);
			expect(successfulRuns[0]).toMatchObject({
				jobId: jobId,
				state: RunState.Success,
				attempt: 2,
			});
		});
	});
});
