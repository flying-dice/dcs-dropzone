import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import Logger from "../Logger.ts";
import { BaseProcess, type ProcessResult } from "./BaseProcess.ts";

/**
 * Mock concrete implementation for testing
 */
class MockProcess extends BaseProcess {
	private shouldSucceed: boolean;
	private executionDelayMs: number;

	constructor(jobId: string, shouldSucceed = true, executionDelayMs = 100) {
		super(jobId, Logger.getLogger("MockProcess"));
		this.shouldSucceed = shouldSucceed;
		this.executionDelayMs = executionDelayMs;
	}

	protected async executeProcess(): Promise<ProcessResult> {
		// Simulate some work
		await new Promise((resolve) => setTimeout(resolve, this.executionDelayMs));

		if (this.shouldSucceed) {
			return {
				success: true,
				exitCode: 0,
			};
		}

		return {
			success: false,
			exitCode: 1,
			error: new Error("Mock process failed"),
		};
	}
}

describe("BaseProcess", () => {
	const testJobId = "test-job-123";

	afterEach(() => {
		// Clean up any lingering processes
		BaseProcess.cancelJob(testJobId);
	});

	test("should register process in active registry", () => {
		const process = new MockProcess(testJobId);
		expect(BaseProcess.getActiveProcess(testJobId)).toBe(process);
		expect(BaseProcess.getActiveProcessCount()).toBe(1);
	});

	test("should prevent duplicate processes for same job", () => {
		new MockProcess(testJobId);
		expect(() => new MockProcess(testJobId)).toThrow(
			/already running/,
		);
	});

	test("should execute process successfully", async () => {
		const process = new MockProcess(testJobId, true);
		const result = await process.start(() => {});

		expect(result.success).toBe(true);
		expect(result.exitCode).toBe(0);
	});

	test("should handle process failure", async () => {
		const process = new MockProcess(testJobId, false);
		const result = await process.start(() => {});

		expect(result.success).toBe(false);
		expect(result.exitCode).toBe(1);
		expect(result.error).toBeDefined();
	});

	test("should cleanup and deregister after execution", async () => {
		const process = new MockProcess(testJobId);
		await process.start(() => {});

		expect(BaseProcess.getActiveProcess(testJobId)).toBeUndefined();
		expect(BaseProcess.getActiveProcessCount()).toBe(0);
	});

	test("should cleanup and deregister after failure", async () => {
		const process = new MockProcess(testJobId, false);
		await process.start(() => {});

		expect(BaseProcess.getActiveProcess(testJobId)).toBeUndefined();
		expect(BaseProcess.getActiveProcessCount()).toBe(0);
	});

	test("should cancel running process", async () => {
		const process = new MockProcess(testJobId, true, 5000); // Long-running

		// Start process (don't await)
		const promise = process.start(() => {});

		// Wait a bit for it to start
		await new Promise((resolve) => setTimeout(resolve, 50));

		// Cancel it
		await process.cancel();

		// Should be deregistered
		expect(BaseProcess.getActiveProcess(testJobId)).toBeUndefined();

		// Original promise should complete
		await promise;
	});

	test("should cancel job by ID", async () => {
		const process = new MockProcess(testJobId, true, 5000);

		// Start process (don't await)
		const promise = process.start(() => {});

		// Wait a bit for it to start
		await new Promise((resolve) => setTimeout(resolve, 50));

		// Cancel by ID
		const cancelled = await BaseProcess.cancelJob(testJobId);

		expect(cancelled).toBe(true);
		expect(BaseProcess.getActiveProcess(testJobId)).toBeUndefined();

		await promise;
	});

	test("should return false when cancelling non-existent job", async () => {
		const cancelled = await BaseProcess.cancelJob("non-existent-job");
		expect(cancelled).toBe(false);
	});

	test("should track multiple active processes", () => {
		const process1 = new MockProcess("job-1");
		const process2 = new MockProcess("job-2");
		const process3 = new MockProcess("job-3");

		expect(BaseProcess.getActiveProcessCount()).toBe(3);
		expect(BaseProcess.getActiveJobIds()).toEqual(["job-1", "job-2", "job-3"]);

		// Cleanup
		BaseProcess.cancelJob("job-1");
		BaseProcess.cancelJob("job-2");
		BaseProcess.cancelJob("job-3");
	});

	test("should allow same job ID after cleanup", async () => {
		const process1 = new MockProcess(testJobId);
		await process1.start(() => {});

		// Should be able to create new process with same ID
		const process2 = new MockProcess(testJobId);
		expect(BaseProcess.getActiveProcess(testJobId)).toBe(process2);
	});
});
