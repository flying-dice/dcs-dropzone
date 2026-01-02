import { describe, expect, it } from "bun:test";
import { ExponentialBackoff } from "../adapters";

describe("ExponentialBackoff", () => {
	it("should calculate exponential delays", () => {
		const calc = new ExponentialBackoff({ baseDelayMs: 1000, multiplier: 2 });
		const baseDate = new Date("2024-01-01T00:00:00Z");

		const attempt1 = calc.calculate(1, baseDate);
		const attempt2 = calc.calculate(2, baseDate);
		const attempt3 = calc.calculate(3, baseDate);

		expect(attempt1.getTime() - baseDate.getTime()).toBe(1000);
		expect(attempt2.getTime() - baseDate.getTime()).toBe(2000);
		expect(attempt3.getTime() - baseDate.getTime()).toBe(4000);
	});

	it("should cap at maxDelayMs", () => {
		const calc = new ExponentialBackoff({
			baseDelayMs: 1000,
			multiplier: 2,
			maxDelayMs: 5000,
		});
		const baseDate = new Date("2024-01-01T00:00:00Z");

		const attempt10 = calc.calculate(10, baseDate);

		expect(attempt10.getTime() - baseDate.getTime()).toBe(5000);
	});

	it("should use default values when no options provided", () => {
		const calc = new ExponentialBackoff();
		const baseDate = new Date("2024-01-01T00:00:00Z");

		const attempt1 = calc.calculate(1, baseDate);

		// Default baseDelayMs is 1000
		expect(attempt1.getTime() - baseDate.getTime()).toBe(1000);
	});

	it("should use current time when baseDate not provided", () => {
		const calc = new ExponentialBackoff({ baseDelayMs: 1000 });
		const before = Date.now();
		const result = calc.calculate(1);
		const after = Date.now();

		expect(result.getTime()).toBeGreaterThanOrEqual(before + 1000);
		expect(result.getTime()).toBeLessThanOrEqual(after + 1000);
	});

	it("should handle large attempt numbers without overflow", () => {
		const calc = new ExponentialBackoff({
			baseDelayMs: 1000,
			multiplier: 2,
			maxDelayMs: 3600000, // 1 hour
		});
		const baseDate = new Date("2024-01-01T00:00:00Z");

		const attempt100 = calc.calculate(100, baseDate);

		// Should be capped at maxDelayMs
		expect(attempt100.getTime() - baseDate.getTime()).toBe(3600000);
	});

	it("should allow custom multiplier", () => {
		const calc = new ExponentialBackoff({
			baseDelayMs: 1000,
			multiplier: 3,
		});
		const baseDate = new Date("2024-01-01T00:00:00Z");

		const attempt1 = calc.calculate(1, baseDate);
		const attempt2 = calc.calculate(2, baseDate);
		const attempt3 = calc.calculate(3, baseDate);

		expect(attempt1.getTime() - baseDate.getTime()).toBe(1000); // 1000 * 3^0
		expect(attempt2.getTime() - baseDate.getTime()).toBe(3000); // 1000 * 3^1
		expect(attempt3.getTime() - baseDate.getTime()).toBe(9000); // 1000 * 3^2
	});
});
