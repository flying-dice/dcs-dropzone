import "./log4js.ts";
import { describe, expect, it } from "bun:test";
import * as assert from "node:assert";
import { err, ok, type Result } from "neverthrow";
import { JobErrorCode, JobState } from "../JobRecordRepository.ts";
import type { Processor } from "../Processor.ts";
import type { Queue } from "../Queue.ts";
import {
	createTestContext,
	delay,
	waitForAllJobsFinish,
	waitForJobFinish,
	waitForJobRunFinish,
	waitForJobRunStart,
} from "./utils.ts";

describe("Queue", () => {
	describe("add", () => {
		it("should add a job with default scheduledAt", async () => {
			const c = createTestContext();
			const queue: Queue = c.build();

			queue.add("test", { foo: "bar" });

			const jobs = queue.getAllForProcessor("test");
			expect(jobs.length).toBe(1);
			const job = jobs[0]!;

			expect(job).toMatchObject({
				jobId: expect.any(String),
				runId: expect.any(String),
				processorName: "test",
				jobData: { foo: "bar" },
				state: JobState.Pending,
			});
		});
	});

	describe("job execution", () => {
		it("should execute a job when eligible", async () => {
			type JobData = { value: number };
			let processedData: JobData | undefined;

			const processor: Processor<JobData, string> = {
				name: "test",
				process: async (data) => {
					processedData = data;
					return ok("done");
				},
			};

			const c = createTestContext({ processors: [processor] });
			const queue: Queue = c.build();

			const job = queue.add("test", { value: 42 });

			expect(processedData).toBeUndefined();

			queue.start();
			await waitForJobFinish(c, job.jobId);
			queue.stop();

			expect(processedData).toBeDefined();
			expect(processedData).toEqual({ value: 42 });

			const completedJobs = queue
				.getAllForProcessor("test")
				.filter((j) => ![JobState.Pending, JobState.Running].includes(j.state));

			const run = queue.getByRunId(job.runId);
			expect(completedJobs.length).toBe(1);
			expect(run).toMatchObject({
				jobId: job.jobId,
				runId: job.runId,
				processorName: "test",
				jobData: { value: 42 },
				state: JobState.Success,
			});
		});

		it("should fail if return value is not a result", async () => {
			enum Action {
				ReturnString,
				ReturnUndefined,
				ReturnOk,
			}

			let _action: Action = Action.ReturnString;

			const processor: Processor = {
				name: "test",
				process: async () => {
					switch (_action) {
						case Action.ReturnString:
							_action = Action.ReturnUndefined;
							return "done" as unknown as Result<string, string>;
						case Action.ReturnUndefined:
							_action = Action.ReturnOk;
							return undefined as unknown as Result<string, string>;
						case Action.ReturnOk:
							return ok("done");
					}
				},
			};

			const c = createTestContext({ processors: [processor] });
			const queue: Queue = c.build();
			const job = queue.add("test", {});

			queue.start();
			await waitForJobFinish(c, job.jobId);
			queue.stop();

			const runs = queue.getAllByJobId(job.jobId);
			expect(runs).toBeDefined();
			assert.ok(runs, "Expected runs to be defined");

			expect(runs.length).toBe(3);

			expect(runs[0]).toMatchObject({
				state: JobState.Failed,
				errorCode: JobErrorCode.ProcessorException,
				errorMessage:
					"AssertionError [ERR_ASSERTION]: Processor returned an invalid value, expected type 'Result' but received type 'string'",
			});
			expect(runs[1]).toMatchObject({
				state: JobState.Failed,
				errorCode: JobErrorCode.ProcessorException,
				errorMessage:
					"AssertionError [ERR_ASSERTION]: Processor returned an invalid value, expected type 'Result' but received type 'undefined'",
			});
			expect(runs[2]).toMatchObject({
				state: JobState.Success,
				result: "done",
			});
		});
	});

	describe("retry behavior", () => {
		it("should reschedule a job on failure and complete after retries", async () => {
			const failCount = 2;
			let attempts = 0;

			const processor: Processor = {
				name: "test",
				process: async () => {
					attempts++;
					if (attempts <= failCount) {
						return err(`Simulated failure (attempt ${attempts})`);
					}
					return ok("success");
				},
			};

			const c = createTestContext({
				processors: [processor],
			});
			const queue: Queue = c.build();

			const job = queue.add("test", {});

			queue.start();
			await waitForJobFinish(c, job.jobId, 10);
			queue.stop();

			expect(attempts).toBe(3);

			const updatedJob = queue.getByRunId(job.runId);
			expect(updatedJob?.finishedAt).toBeInstanceOf(Date);

			const runs = queue.getAllByJobId(job.jobId);
			expect(runs).toBeDefined();
			assert.ok(runs, "Expected runs to be defined");
			expect(runs.length).toBe(3);
			expect(runs[0]).toMatchObject({
				state: JobState.Failed,
				errorCode: JobErrorCode.ProcessorError,
				errorMessage: "Simulated failure (attempt 1)",
			});
			expect(runs[1]).toMatchObject({
				state: JobState.Failed,
				errorCode: JobErrorCode.ProcessorError,
				errorMessage: "Simulated failure (attempt 2)",
			});
			expect(runs[2]).toMatchObject({
				state: JobState.Success,
				result: "success",
			});
		});

		it("should store error message on failed run", async () => {
			const processor: Processor = {
				name: "test",
				process: async () => {
					return err("Something went wrong");
				},
			};

			const c = createTestContext({
				processors: [processor],
			});
			const queue: Queue = c.build();

			const job = queue.add("test", {});

			queue.start();
			await waitForJobRunFinish(c, job.runId);
			queue.stop();

			const latest = queue.getByRunId(job.runId);
			expect(latest).toBeDefined();
			assert.ok(latest, "Expected latest job to be defined");

			expect(latest.errorCode).toBe(JobErrorCode.ProcessorError);
			expect(latest.errorMessage).toBe("Something went wrong");
		});

		it("should handle general exceptions in the processor", async () => {
			let _throw = true;

			const processor: Processor = {
				name: "test",
				process: async () => {
					if (_throw) {
						_throw = false;
						throw new Error("Unexpected error");
					}
					return ok("done");
				},
			};

			const c = createTestContext({ processors: [processor] });
			const queue: Queue = c.build();
			const job = queue.add("test", {});
			queue.start();
			await waitForJobRunFinish(c, job.runId);
			queue.stop();

			const failedRuns = queue.getAllForProcessor("test").filter((r) => r.state === JobState.Failed);

			expect(failedRuns.length).toBe(1);

			const latest = queue.getByRunId(job.runId);
			expect(latest).toBeDefined();
			assert.ok(latest, "Expected latest job to be defined");
			expect(latest.errorCode).toBe(JobErrorCode.ProcessorException);
			expect(latest.errorMessage).toBe("Error: Unexpected error");
		});
	});

	describe("progress tracking", () => {
		it("should save job progress during execution", async () => {
			const progressUpdates: number[] = [];
			const progressSteps = [25, 50, 75, 100];

			const processor: Processor = {
				name: "test",
				process: async (_job, ctx) => {
					for (const step of progressSteps) {
						progressUpdates.push(step);
						ctx.updateProgress(step);
					}
					return ok("done");
				},
			};
			const c = createTestContext({ processors: [processor] });
			const queue: Queue = c.build();

			const job = queue.add("test", {});

			queue.start();
			await waitForJobFinish(c, job.jobId);
			queue.stop();

			const updatedJob = queue.getByRunId(job.runId);
			expect(updatedJob?.progress).toBe(100);
			expect(updatedJob?.progressUpdatedAt).toBeInstanceOf(Date);
			expect(progressUpdates).toEqual(progressSteps);
		});
	});

	describe("start/stop", () => {
		it("should track running state", () => {
			const c = createTestContext();
			const queue: Queue = c.build();

			expect(queue.running).toBe(false);
			queue.start();
			expect(queue.running).toBe(true);
			queue.stop();
			expect(queue.running).toBe(false);
		});

		it("should not start twice", () => {
			const c = createTestContext();
			const queue: Queue = c.build();
			queue.start();
			queue.start();
			expect(queue.running).toBe(true);
			queue.stop();
		});

		it("should stop processing when stopped", async () => {
			let processCount = 0;

			const processor: Processor = {
				name: "test",
				process: async () => {
					processCount++;
					return ok("done");
				},
			};

			const c = createTestContext({ processors: [processor] });
			const queue: Queue = c.build();

			queue.add("test", {});

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
				name: "queueA",
				process: async () => {
					results.push("A");
					return ok("A");
				},
			};

			const processorB: Processor = {
				name: "queueB",
				process: async () => {
					results.push("B");
					return ok("B");
				},
			};

			const c = createTestContext({ processors: [processorA, processorB] });
			const queue: Queue = c.build();

			queue.add("queueA", {});
			queue.add("queueB", {});

			queue.start();
			await waitForAllJobsFinish(c);
			queue.stop();

			expect(results.sort()).toEqual(["A", "B"]);
		});

		it("should not process jobs without a matching processor", async () => {
			const processor: Processor = {
				name: "test",
				process: async () => {
					return ok("done");
				},
			};
			const c = createTestContext({ processors: [processor] });
			const queue: Queue = c.build();

			const jobWithoutProcessorId = queue.add("test_noproc", {});
			const jobWithProcessorId = queue.add("test", {});

			queue.start();
			await delay(500);
			queue.stop();

			const latestJobWithoutProcessor = queue.getByRunId(jobWithoutProcessorId.runId);
			expect(latestJobWithoutProcessor).toBeDefined();
			assert.ok(latestJobWithoutProcessor, "Expected latest job to be defined");
			expect(latestJobWithoutProcessor.state).toBe(JobState.Pending);

			const latestJobWithProcessor = queue.getByRunId(jobWithProcessorId.runId);
			expect(latestJobWithProcessor).toBeDefined();
			assert.ok(latestJobWithProcessor, "Expected latest job to be defined");
			expect(latestJobWithProcessor.state).toBe(JobState.Success);
		});
	});

	describe("Reconciliation", () => {
		it("should reconcile stuck runs when job-run is not found in memory", async () => {
			const processor: Processor = {
				name: "test",
				process: async () => {
					return ok("done");
				},
			};

			const c = createTestContext({ processors: [processor] });
			const queue: Queue = c.build();

			const job = queue.add("test", {});

			c.deps.jobRecordRepository.__rawSave({
				...job,
				startedAt: new Date(),
				state: JobState.Running,
			});

			queue.start();
			await waitForJobFinish(c, job.jobId);
			queue.stop();

			const jobs = queue.getAllByJobId(job.jobId);

			expect(jobs.length).toBe(2);
			expect(jobs[0]).toMatchObject({
				jobId: job.jobId,
				state: JobState.Failed,
				errorCode: JobErrorCode.JobRunNotFound,
			});
			expect(jobs[1]).toMatchObject({
				jobId: job.jobId,
				state: JobState.Success,
				result: "done",
			});
		});
	});

	describe("Cancellation", () => {
		it("should cancel a pending job", async () => {
			const processed: number[] = [];

			const processor: Processor<{ id: number }, string> = {
				name: "test",
				process: async ({ id }) => {
					processed.push(id);
					return ok("done");
				},
			};

			const c = createTestContext({ processors: [processor] });
			const queue: Queue = c.build();

			const jobToCancel = queue.add("test", { id: 1 });
			const jobNotToCancel = queue.add("test", { id: 2 });

			queue.cancel(jobToCancel);

			queue.start();
			await waitForAllJobsFinish(c);
			queue.stop();

			const updatedJobToCancel = queue.getByRunId(jobToCancel.runId);
			expect(updatedJobToCancel?.state).toBe(JobState.Cancelled);
			const updatedJobNotToCancel = queue.getByRunId(jobNotToCancel.runId);
			expect(updatedJobNotToCancel?.state).toBe(JobState.Success);
			expect(processed).toEqual([2]);
		});

		it("should abort a running job", async () => {
			let started = false;
			let finished = false;
			const processor: Processor = {
				name: "test",
				process: async (_job, ctx) => {
					started = true;
					await delay(30_000, ctx.abortSignal);
					finished = true;
					return ok("done");
				},
			};

			const c = createTestContext({ processors: [processor] });
			const queue: Queue = c.build();

			const job = queue.add("test", {});

			queue.start();
			await waitForJobRunStart(c, job.runId);
			queue.cancel(job);
			await waitForAllJobsFinish(c);
			queue.stop();

			const updatedJob = queue.getByRunId(job.runId);
			expect(updatedJob?.state).toBe(JobState.Cancelled);
			expect(started).toBe(true);
			expect(finished).toBe(false);
		});
	});
});
