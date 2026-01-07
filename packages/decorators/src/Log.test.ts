import { describe, expect, it, mock } from "bun:test";
import type { Logger } from "log4js";
import { Log } from "./Log.ts";

describe("Log", () => {
	describe("Sync", () => {
		it("should log method execution", () => {
			const logger: Pick<Logger, "trace" | "error"> = {
				trace: mock(),
				error: mock(),
			};

			class TestClass {
				@Log(logger)
				testMethod(a: number, b: string): string {
					return `Number: ${a}, String: ${b}`;
				}
			}

			const testInstance = new TestClass();
			const result = testInstance.testMethod(42, "Hello");

			expect(result).toEqual("Number: 42, String: Hello");
			expect(logger.trace).toHaveBeenNthCalledWith(1, "Method testMethod called", [42, "Hello"]);
			expect(logger.trace).toHaveBeenNthCalledWith(
				2,
				expect.stringMatching(/^Method testMethod executed successfully in \d+ms$/),
			);
		});

		it("should log method execution failure", () => {
			const logger: Pick<Logger, "trace" | "error"> = {
				trace: mock(),
				error: mock(),
			};

			class TestClass {
				@Log(logger)
				testMethod(a: number, b: string): string {
					throw new Error("Test error");
				}
			}

			const testInstance = new TestClass();

			expect(() => testInstance.testMethod(42, "Hello")).toThrow("Test error");
			expect(logger.trace).toHaveBeenNthCalledWith(1, "Method testMethod called", [42, "Hello"]);
			expect(logger.error).toHaveBeenNthCalledWith(
				1,
				expect.stringMatching(/^Method testMethod failed after \d+ms with error$/),
				expect.any(Error),
			);
		});
	});

	describe("Async", () => {
		it("should log async method execution", async () => {
			const logger: Pick<Logger, "trace" | "error"> = {
				trace: mock(),
				error: mock(),
			};

			class TestClass {
				@Log(logger)
				async testAsyncMethod(a: number, b: string): Promise<string> {
					return `Number: ${a}, String: ${b}`;
				}
			}

			const testInstance = new TestClass();
			const result = await testInstance.testAsyncMethod(42, "Hello");
			expect(result).toEqual("Number: 42, String: Hello");
			expect(logger.trace).toHaveBeenNthCalledWith(1, "Method testAsyncMethod called", [42, "Hello"]);
			expect(logger.trace).toHaveBeenNthCalledWith(
				2,
				expect.stringMatching(/^Method testAsyncMethod executed successfully in \d+ms$/),
			);
		});

		it("should log async method execution failure", async () => {
			const logger: Pick<Logger, "trace" | "error"> = {
				trace: mock(),
				error: mock(),
			};

			class TestClass {
				@Log(logger)
				async testAsyncMethod(a: number, b: string): Promise<string> {
					throw new Error("Test error");
				}
			}

			const testInstance = new TestClass();
			expect(() => testInstance.testAsyncMethod(42, "Hello")).toThrow("Test error");
			expect(logger.trace).toHaveBeenNthCalledWith(1, "Method testAsyncMethod called", [42, "Hello"]);
			expect(logger.error).toHaveBeenNthCalledWith(
				1,
				expect.stringMatching(/^Method testAsyncMethod failed after \d+ms with error$/),
				expect.any(Error),
			);
		});
	});
});
