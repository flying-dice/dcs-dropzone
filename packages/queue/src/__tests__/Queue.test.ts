import { describe, expect, it } from "bun:test";
import { ExponentialBackoff } from "../adapters";
import type { Processor } from "../index.ts";
import { createTestQueue } from "./fixtures.ts";
import { delay, waitForAllJobsCompleted, waitForJobCompletion } from "./utils.ts";

describe("Queue", () => {
	describe("add", () => {
		it("should add a job with default scheduledAt", async () => {
			const queue = createTestQueue();

			const job = await queue.add({
				queue: "test",
				name: "testJob",
				data: { foo: "bar" },
			});

			expect(job.id).toBeDefined();
			expect(job.queue).toBe("test");
			expect(job.name).toBe("testJob");
			expect(job.data).toEqual({ foo: "bar" });
			expect(job.attempts).toBe(0);
			expect(job.createdAt).toBeInstanceOf(Date);
			expect(job.scheduledAt).toEqual(job.createdAt);
			expect(job.completedAt).toBeUndefined();
		});

		it("should add a job with custom scheduledAt", async () => {
			const queue = createTestQueue();

			const futureDate = new Date(Date.now() + 60000);
			const job = await queue.add({
				queue: "test",
				name: "testJob",
				data: {},
				scheduledAt: futureDate,
			});

			expect(job.scheduledAt).toEqual(futureDate);
		});
	});

	describe("job execution", () => {
		it("should execute a job when eligible", async () => {
			let processedData: unknown = null;

			const processor: Processor = {
				queue: "test",
				name: "testJob",
				process: async (job) => {
					processedData = job.data;
					return "done";
				},
			};

			const queue = createTestQueue({ processors: [processor] });

			const job = await queue.add({
				queue: "test",
				name: "testJob",
				data: { value: 42 },
			});

			queue.start();
			await waitForJobCompletion(queue, job.id);
			queue.stop();

			expect(processedData).toEqual({ value: 42 });

			const completedJobs = await queue.listCompletedJobs();
			expect(completedJobs.length).toBe(1);
			expect(completedJobs[0]).toMatchObject({
				id: expect.any(String),
				queue: "test",
				name: "testJob",
				data: { value: 42 },
				attempts: 1,
				createdAt: expect.any(Date),
				scheduledAt: expect.any(Date),
				completedAt: expect.any(Date),
			});
		});

		it("should not execute a job scheduled in the future", async () => {
			let processed = false;

			const processor: Processor = {
				queue: "test",
				name: "testJob",
				process: async () => {
					processed = true;
					return "done";
				},
			};

			const queue = createTestQueue({ processors: [processor] });

			await queue.add({
				queue: "test",
				name: "testJob",
				data: {},
				scheduledAt: new Date(Date.now() + 60000), // 1 minute in the future
			});

			queue.start();
			await delay(100);
			queue.stop();

			expect(processed).toBe(false);
			const pendingJobs = await queue.listPendingJobs();
			expect(pendingJobs.length).toBe(1);
			expect(pendingJobs[0]).toMatchObject({
				id: expect.any(String),
				name: "testJob",
				queue: "test",
				attempts: 0,
				data: {},
				createdAt: expect.any(Date),
				scheduledAt: expect.any(Date),
			});
			expect(pendingJobs[0]?.completedAt).toBeUndefined();
		});

		it("should create a run record on execution", async () => {
			const processor: Processor = {
				queue: "test",
				name: "testJob",
				process: async () => {
					return "result";
				},
			};
			const queue = createTestQueue({ processors: [processor] });

			const job = await queue.add({
				queue: "test",
				name: "testJob",
				data: {},
			});

			queue.start();
			await waitForJobCompletion(queue, job.id);
			queue.stop();

			const runs = await queue.getJobRuns(job.id);
			expect(runs.length).toBe(1);
			expect(runs[0]?.state).toBe("success");
			expect(runs[0]?.result).toBe("result");
			expect(runs[0]?.attempt).toBe(1);
		});

		it("should process jobs in scheduledAt order", async () => {
			const processedOrder: string[] = [];

			const processor: Processor = {
				queue: "test",
				name: "orderJob",
				process: async (job) => {
					processedOrder.push(job.data as string);
					return "done";
				},
			};

			const queue = createTestQueue({ processors: [processor] });

			const now = Date.now();
			await queue.add({
				queue: "test",
				name: "orderJob",
				data: "third",
				scheduledAt: new Date(now + 20),
			});
			await queue.add({
				queue: "test",
				name: "orderJob",
				data: "first",
				scheduledAt: new Date(now - 20),
			});
			await queue.add({
				queue: "test",
				name: "orderJob",
				data: "second",
				scheduledAt: new Date(now),
			});

			queue.start();
			await waitForAllJobsCompleted(queue);
			queue.stop();

			expect(processedOrder).toEqual(["first", "second", "third"]);
		});
	});

	describe("retry behavior", () => {
		it("should reschedule a job on failure and complete after retries", async () => {
			const failCount = 2;
			let attempts = 0;

			const processor: Processor = {
				queue: "test",
				name: "failingJob",
				process: async () => {
					attempts++;
					if (attempts <= failCount) {
						throw new Error(`Simulated failure (attempt ${attempts})`);
					}
					return "success";
				},
			};

			const queue = createTestQueue({
				processors: [processor],
				exponentCalculator: new ExponentialBackoff({ baseDelayMs: 10 }),
			});

			const job = await queue.add({
				queue: "test",
				name: "failingJob",
				data: {},
			});

			queue.start();
			await waitForJobCompletion(queue, job.id, 10);
			queue.stop();

			expect(attempts).toBe(3);

			const updatedJob = await queue.getJob(job.id);
			expect(updatedJob?.attempts).toBe(3);
			expect(updatedJob?.completedAt).toBeInstanceOf(Date);

			const runs = await queue.getJobRuns(job.id);
			expect(runs.length).toBe(3);
			expect(runs[0]).toMatchObject({
				id: expect.any(String),
				jobId: job.id,
				state: "failed",
				attempt: 1,
				startedAt: expect.any(Date),
				endedAt: expect.any(Date),
				error: "Simulated failure (attempt 1)",
			});
			expect(runs[1]).toMatchObject({
				id: expect.any(String),
				jobId: job.id,
				state: "failed",
				attempt: 2,
				startedAt: expect.any(Date),
				endedAt: expect.any(Date),
				error: "Simulated failure (attempt 2)",
			});
			expect(runs[2]).toMatchObject({
				id: expect.any(String),
				jobId: job.id,
				state: "success",
				attempt: 3,
				startedAt: expect.any(Date),
				endedAt: expect.any(Date),
				result: "success",
			});
		});

		it("should store error message on failed run", async () => {
			const processor: Processor = {
				queue: "test",
				name: "errorJob",
				process: async () => {
					throw new Error("Something went wrong");
				},
			};

			const queue = createTestQueue({
				processors: [processor],
				exponentCalculator: new ExponentialBackoff({ baseDelayMs: 10000 }),
			});

			const job = await queue.add({
				queue: "test",
				name: "errorJob",
				data: {},
			});

			queue.start();
			await delay(100);
			queue.stop();

			const failedRuns = await queue.listFailedRuns();
			expect(failedRuns.length).toBe(1);
			expect(failedRuns[0]?.error).toBe("Something went wrong");
			expect(failedRuns[0]?.jobId).toBe(job.id);
		});
	});

	describe("progress tracking", () => {
		it("should update job progress during execution", async () => {
			const progressUpdates: number[] = [];
			const progressSteps = [25, 50, 75, 100];

			const processor: Processor = {
				queue: "test",
				name: "progressJob",
				process: async (_job, ctx) => {
					for (const step of progressSteps) {
						progressUpdates.push(step);
						await ctx.updateProgress({ percent: step });
					}
					return "done";
				},
			};
			const queue = createTestQueue({ processors: [processor] });

			const job = await queue.add({
				queue: "test",
				name: "progressJob",
				data: {},
			});

			queue.start();
			await waitForJobCompletion(queue, job.id);
			queue.stop();

			const updatedJob = await queue.getJob(job.id);
			expect(updatedJob?.progress).toEqual({ percent: 100 });
			expect(updatedJob?.progressUpdatedAt).toBeInstanceOf(Date);
			expect(progressUpdates).toEqual(progressSteps);
		});

		it("should preserve progress across retries", async () => {
			let attempt = 0;

			const processor: Processor = {
				queue: "test",
				name: "progressRetryJob",
				process: async (_job, ctx) => {
					attempt++;
					await ctx.updateProgress({ percent: attempt * 25, attempt });
					if (attempt < 2) {
						throw new Error("Fail first time");
					}
					return "success";
				},
			};

			const queue = createTestQueue({
				processors: [processor],
				exponentCalculator: new ExponentialBackoff({ baseDelayMs: 10 }),
			});

			const job = await queue.add({
				queue: "test",
				name: "progressRetryJob",
				data: {},
			});

			queue.start();
			await waitForJobCompletion(queue, job.id);
			queue.stop();

			const updatedJob = await queue.getJob(job.id);
			expect(updatedJob?.progress).toEqual({ percent: 50, attempt: 2 });
		});
	});

	describe("inspection helpers", () => {
		it("should list pending and completed jobs", async () => {
			const processor: Processor = {
				queue: "test",
				name: "testJob",
				process: async () => {
					return "done";
				},
			};

			const queue = createTestQueue({ processors: [processor] });

			await queue.add({ queue: "test", name: "testJob", data: { id: 1 } });
			await queue.add({
				queue: "test",
				name: "testJob",
				data: { id: 2 },
				scheduledAt: new Date(Date.now() + 60000),
			});

			let pending = await queue.listPendingJobs();
			expect(pending.length).toBe(2);

			queue.start();
			await delay(100);
			queue.stop();

			pending = await queue.listPendingJobs();
			const completed = await queue.listCompletedJobs();

			expect(pending.length).toBe(1);
			expect(completed.length).toBe(1);
		});

		it("should filter jobs by queue", async () => {
			const queue = createTestQueue();

			await queue.add({ queue: "queue1", name: "job", data: {} });
			await queue.add({ queue: "queue2", name: "job", data: {} });
			await queue.add({ queue: "queue1", name: "job", data: {} });

			const allJobs = await queue.listJobs();
			const queue1Jobs = await queue.listJobs("queue1");
			const queue2Jobs = await queue.listJobs("queue2");

			expect(allJobs.length).toBe(3);
			expect(queue1Jobs.length).toBe(2);
			expect(queue2Jobs.length).toBe(1);
		});

		it("should get latest run for a job", async () => {
			const failCount = 1;
			let attempts = 0;

			const processor: Processor = {
				queue: "test",
				name: "testJob",
				process: async () => {
					attempts++;
					if (attempts <= failCount) {
						throw new Error(`Simulated failure (attempt ${attempts})`);
					}
					return "success";
				},
			};

			const queue = createTestQueue({
				processors: [processor],
				exponentCalculator: new ExponentialBackoff({ baseDelayMs: 10 }),
			});

			const job = await queue.add({
				queue: "test",
				name: "testJob",
				data: {},
			});

			queue.start();
			await waitForJobCompletion(queue, job.id);
			queue.stop();

			const latestRun = await queue.getLatestRun(job.id);
			expect(latestRun?.attempt).toBe(2);
			expect(latestRun?.state).toBe("success");
		});

		it("should list all runs for a job", async () => {
			const failCount = 2;
			let attempts = 0;

			const processor: Processor = {
				queue: "test",
				name: "testJob",
				process: async () => {
					attempts++;
					if (attempts <= failCount) {
						throw new Error(`Simulated failure (attempt ${attempts})`);
					}
					return "success";
				},
			};

			const queue = createTestQueue({
				processors: [processor],
				exponentCalculator: new ExponentialBackoff({ baseDelayMs: 10 }),
			});

			const job = await queue.add({
				queue: "test",
				name: "testJob",
				data: {},
			});

			queue.start();
			await waitForJobCompletion(queue, job.id, 10);
			queue.stop();

			const runs = await queue.getJobRuns(job.id);
			expect(runs.length).toBe(3);
			expect(runs.map((r) => r.attempt)).toEqual([1, 2, 3]);
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

			const processor: Processor = {
				queue: "test",
				name: "countJob",
				process: async () => {
					processCount++;
					return "done";
				},
			};

			const queue = createTestQueue({ processors: [processor] });

			await queue.add({ queue: "test", name: "countJob", data: {} });

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

			const processorA: Processor = {
				queue: "queueA",
				name: "jobA",
				process: async () => {
					results.push("A");
					return "A";
				},
			};

			const processorB: Processor = {
				queue: "queueB",
				name: "jobB",
				process: async () => {
					results.push("B");
					return "B";
				},
			};

			const queue = createTestQueue({ processors: [processorA, processorB] });

			await queue.add({ queue: "queueA", name: "jobA", data: {} });
			await queue.add({ queue: "queueB", name: "jobB", data: {} });

			queue.start();
			await waitForAllJobsCompleted(queue);
			queue.stop();

			expect(results.sort()).toEqual(["A", "B"]);
		});

		it("should not process jobs without a matching processor", async () => {
			const processor: Processor = {
				queue: "test",
				name: "knownJob",
				process: async () => {
					return "done";
				},
			};
			const queue = createTestQueue({ processors: [processor] });

			const now = Date.now();
			// Schedule unknownJob later so knownJob gets processed first
			await queue.add({
				queue: "test",
				name: "unknownJob",
				data: {},
				scheduledAt: new Date(now + 10),
			});
			await queue.add({
				queue: "test",
				name: "knownJob",
				data: {},
				scheduledAt: new Date(now - 10),
			});

			queue.start();
			await delay(100);
			queue.stop();

			const completed = await queue.listCompletedJobs();
			const pending = await queue.listPendingJobs();

			expect(completed.length).toBe(1);
			expect(completed[0]?.name).toBe("knownJob");
			expect(pending.length).toBe(1);
			expect(pending[0]?.name).toBe("unknownJob");
		});
	});
});
