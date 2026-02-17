import { afterEach, beforeEach, describe, expect, it, setSystemTime } from "bun:test";
import type { DelayCalculator } from "./DelayCalculator.ts";
import { RetryBackoffManager } from "./RetryBackoffManager";

class RecordingDelayCalculator implements DelayCalculator {
	calls: number[] = [];

	constructor(private readonly delayMs: number = 1000) {}

	calculateDelayMs(attempt: number): number {
		this.calls.push(attempt);
		return this.delayMs;
	}
}

describe("RetryBackoffManager", () => {
	const baseTime = new Date("2025-01-01T00:00:00.000Z");

	beforeEach(() => {
		setSystemTime(baseTime);
	});

	afterEach(() => {
		setSystemTime();
	});

	describe("trackFailure", () => {
		it("puts a job into backoff after a failure", () => {
			const manager = new RetryBackoffManager(new RecordingDelayCalculator());

			manager.trackFailure("job1");

			expect(manager.getAllJobIdsCurrentlyInBackoff()).toContain("job1");
		});

		it("increments the attempt count on each failure", () => {
			const calculator = new RecordingDelayCalculator();
			const manager = new RetryBackoffManager(calculator);

			manager.trackFailure("job1");
			manager.trackFailure("job1");
			manager.trackFailure("job1");

			expect(calculator.calls).toEqual([1, 2, 3]);
		});

		it("tracks attempts independently per job", () => {
			const calculator = new RecordingDelayCalculator();
			const manager = new RetryBackoffManager(calculator);

			manager.trackFailure("job1");
			manager.trackFailure("job2");
			manager.trackFailure("job1");

			expect(calculator.calls).toEqual([1, 1, 2]);
		});
	});

	describe("hasExhaustedRetries", () => {
		it("returns false when no failures have been tracked", () => {
			const manager = new RetryBackoffManager(new RecordingDelayCalculator());

			expect(manager.hasExhaustedRetries("job1")).toBe(false);
		});

		it("returns false when attempts are below the max", () => {
			const manager = new RetryBackoffManager(new RecordingDelayCalculator());

			manager.trackFailure("job1");
			manager.trackFailure("job1");

			expect(manager.hasExhaustedRetries("job1")).toBe(false);
		});

		it("returns true when attempts reach the max", () => {
			const manager = new RetryBackoffManager(new RecordingDelayCalculator());

			manager.trackFailure("job1");
			manager.trackFailure("job1");
			manager.trackFailure("job1");

			expect(manager.hasExhaustedRetries("job1")).toBe(true);
		});

		it("returns true when attempts exceed the max", () => {
			const manager = new RetryBackoffManager(new RecordingDelayCalculator());

			for (let i = 0; i < 5; i++) {
				manager.trackFailure("job1");
			}

			expect(manager.hasExhaustedRetries("job1")).toBe(true);
		});

		it("tracks exhaustion independently per job", () => {
			const manager = new RetryBackoffManager(new RecordingDelayCalculator());

			manager.trackFailure("job1");
			manager.trackFailure("job1");
			manager.trackFailure("job1");
			manager.trackFailure("job2");

			expect(manager.hasExhaustedRetries("job1")).toBe(true);
			expect(manager.hasExhaustedRetries("job2")).toBe(false);
		});
	});

	describe("getAllJobIdsCurrentlyInBackoff", () => {
		it("returns an empty array when no failures have been tracked", () => {
			const manager = new RetryBackoffManager(new RecordingDelayCalculator());

			expect(manager.getAllJobIdsCurrentlyInBackoff()).toEqual([]);
		});

		it("excludes jobs whose backoff period has expired", () => {
			const manager = new RetryBackoffManager(new RecordingDelayCalculator(1000));

			manager.trackFailure("job1");

			setSystemTime(new Date(baseTime.getTime() + 1001));

			expect(manager.getAllJobIdsCurrentlyInBackoff()).not.toContain("job1");
		});

		it("includes jobs whose backoff period has not yet expired", () => {
			const manager = new RetryBackoffManager(new RecordingDelayCalculator(1000));

			manager.trackFailure("job1");

			setSystemTime(new Date(baseTime.getTime() + 500));

			expect(manager.getAllJobIdsCurrentlyInBackoff()).toContain("job1");
		});

		it("handles a mix of expired and active backoffs", () => {
			const manager = new RetryBackoffManager(new RecordingDelayCalculator(1000));

			manager.trackFailure("job1");

			setSystemTime(new Date(baseTime.getTime() + 500));
			manager.trackFailure("job2");

			setSystemTime(new Date(baseTime.getTime() + 1001));

			const inBackoff = manager.getAllJobIdsCurrentlyInBackoff();
			expect(inBackoff).not.toContain("job1");
			expect(inBackoff).toContain("job2");
		});

		it("re-enters backoff when a job fails again after expiry", () => {
			const manager = new RetryBackoffManager(new RecordingDelayCalculator(1000));

			manager.trackFailure("job1");

			setSystemTime(new Date(baseTime.getTime() + 1001));
			expect(manager.getAllJobIdsCurrentlyInBackoff()).not.toContain("job1");

			manager.trackFailure("job1");
			expect(manager.getAllJobIdsCurrentlyInBackoff()).toContain("job1");
		});

		it("uses the delay from the calculator to set the backoff window", () => {
			const manager = new RetryBackoffManager(new RecordingDelayCalculator(5000));

			manager.trackFailure("job1");

			setSystemTime(new Date(baseTime.getTime() + 3000));
			expect(manager.getAllJobIdsCurrentlyInBackoff()).toContain("job1");

			setSystemTime(new Date(baseTime.getTime() + 5001));
			expect(manager.getAllJobIdsCurrentlyInBackoff()).not.toContain("job1");
		});

		it("handles zero delay (job is never in backoff)", () => {
			const manager = new RetryBackoffManager(new RecordingDelayCalculator(0));

			manager.trackFailure("job1");

			expect(manager.getAllJobIdsCurrentlyInBackoff()).toEqual([]);
		});
	});
});
