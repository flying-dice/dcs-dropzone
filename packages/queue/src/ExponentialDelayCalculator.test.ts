import { describe, expect, it } from "bun:test";
import { ExponentialDelayCalculator } from "./ExponentialDelayCalculator.ts";

describe("ExponentialDelayCalculator", () => {
	it("returns baseDelay for the first attempt", () => {
		const calc = new ExponentialDelayCalculator(1000, 60000);
		expect(calc.calculateDelayMs(1)).toBe(1000);
	});

	it("doubles the delay for each subsequent attempt", () => {
		const calc = new ExponentialDelayCalculator(1000, 60000);
		expect(calc.calculateDelayMs(2)).toBe(2000);
		expect(calc.calculateDelayMs(3)).toBe(4000);
		expect(calc.calculateDelayMs(4)).toBe(8000);
	});

	it("caps the delay at maxDelay", () => {
		const calc = new ExponentialDelayCalculator(1000, 5000);
		expect(calc.calculateDelayMs(4)).toBe(5000);
		expect(calc.calculateDelayMs(10)).toBe(5000);
	});

	it("returns maxDelay when computed delay equals maxDelay", () => {
		const calc = new ExponentialDelayCalculator(1000, 8000);
		expect(calc.calculateDelayMs(4)).toBe(8000);
	});

	it("handles baseDelay of 0", () => {
		const calc = new ExponentialDelayCalculator(0, 60000);
		expect(calc.calculateDelayMs(1)).toBe(0);
		expect(calc.calculateDelayMs(5)).toBe(0);
	});

	it("works with non-power-of-two baseDelay", () => {
		const calc = new ExponentialDelayCalculator(300, 60000);
		expect(calc.calculateDelayMs(1)).toBe(300);
		expect(calc.calculateDelayMs(2)).toBe(600);
		expect(calc.calculateDelayMs(3)).toBe(1200);
	});
});
