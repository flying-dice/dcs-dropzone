import { describe, expect, it } from "bun:test";
import csv from "./csv";

const schema = csv();

describe("csvTransformer", () => {
	it("transforms a valid CSV string into an array of trimmed strings", () => {
		expect(schema.parse("one, two, three")).toEqual(["one", "two", "three"]);
	});

	it("returns undefined for undefined input", () => {
		expect(() => schema.parse(undefined)).toThrowErrorMatchingInlineSnapshot(`
		  "[
		    {
		      "expected": "string",
		      "code": "invalid_type",
		      "path": [],
		      "message": "Invalid input: expected string, received undefined"
		    }
		  ]"
		`);
	});

	it("returns an empty array for an empty CSV string", () => {
		expect(schema.parse("")).toEqual([]);
	});

	it("trims whitespace around each CSV item", () => {
		expect(schema.parse("  one  ,  two ,three ")).toEqual(["one", "two", "three"]);
	});

	it("handles a single-item CSV string", () => {
		expect(schema.parse("single")).toEqual(["single"]);
	});

	it("handles a CSV string with only whitespace", () => {
		expect(schema.parse("   ")).toEqual([]);
	});
});
