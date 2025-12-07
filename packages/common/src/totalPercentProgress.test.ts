import { expect, it } from "bun:test";
import { totalPercentProgress } from "./totalPercentProgress";

it("returns 0 when the input array is empty", () => {
	expect(totalPercentProgress([])).toBe(0);
});

it("returns 0 when all values in the array are null", () => {
	expect(totalPercentProgress([null, null, null])).toBe(0);
});

it("calculates the average progress for an array of valid numbers", () => {
	expect(totalPercentProgress([50, 75, 100])).toBe(75);
});

it("ignores null values when calculating the average progress", () => {
	expect(totalPercentProgress([null, 50, null, 100])).toBe(75);
});

it("ignores NaN values when calculating the average progress", () => {
	expect(totalPercentProgress([NaN, 50, 100])).toBe(75);
});

it("handles a mix of valid numbers, null, and NaN values", () => {
	expect(totalPercentProgress([null, NaN, 25, 75])).toBe(50);
});

it("returns the single value when the array contains one valid number", () => {
	expect(totalPercentProgress([42])).toBe(42);
});

it("returns 0 when the array contains only NaN values", () => {
	expect(totalPercentProgress([NaN, NaN, NaN])).toBe(0);
});
