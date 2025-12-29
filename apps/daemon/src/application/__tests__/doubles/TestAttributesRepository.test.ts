import { describe, expect, it } from "bun:test";
import { TestAttributesRepository } from "./TestAttributesRepository.ts";

describe("TestAttributesRepository", () => {
	describe("getDaemonInstanceId", () => {
		it("returns undefined initially", () => {
			const repo = new TestAttributesRepository();
			expect(repo.getDaemonInstanceId()).toBeUndefined();
		});

		it("returns saved instance ID", () => {
			const repo = new TestAttributesRepository();
			repo.saveDaemonInstanceId("test-id-123");
			expect(repo.getDaemonInstanceId()).toBe("test-id-123");
		});
	});

	describe("saveDaemonInstanceId", () => {
		it("stores instance ID", () => {
			const repo = new TestAttributesRepository();
			const result = repo.saveDaemonInstanceId("my-id");
			expect(result).toBe("my-id");
			expect(repo.getDaemonInstanceId()).toBe("my-id");
		});

		it("overwrites existing instance ID", () => {
			const repo = new TestAttributesRepository();
			repo.saveDaemonInstanceId("first-id");
			repo.saveDaemonInstanceId("second-id");
			expect(repo.getDaemonInstanceId()).toBe("second-id");
		});

		it("returns the saved instance ID", () => {
			const repo = new TestAttributesRepository();
			const result = repo.saveDaemonInstanceId("returned-id");
			expect(result).toBe("returned-id");
		});
	});
});
