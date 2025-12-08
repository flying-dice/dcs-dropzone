import { describe, expect, it } from "bun:test";
import kebabCase from "./tag.ts";

const schema = kebabCase();

describe("tag", () => {
	it("validates a correct tag string", () => {
		expect(schema.parse("my-tag")).toEqual("my-tag");
	});

	it("validates a correct aircraft tag string", () => {
		expect(schema.parse("a-10a")).toEqual("a-10a");
	});

	it("fails validation for a string with spaces", () => {
		expect(() => schema.parse("invalid kebab case")).toThrowErrorMatchingInlineSnapshot(`
		  "[
		    {
		      "code": "custom",
		      "path": [],
		      "message": "INVALID_TAG_FORMAT_ERROR"
		    }
		  ]"
		`);
	});

	it("fails validation for a camelCase string", () => {
		expect(() => schema.parse("camelCaseString")).toThrowErrorMatchingInlineSnapshot(`
		  "[
		    {
		      "code": "custom",
		      "path": [],
		      "message": "INVALID_TAG_FORMAT_ERROR"
		    }
		  ]"
		`);
	});

	it("fails validation for a snake_case string", () => {
		expect(() => schema.parse("snake_case_string")).toThrowErrorMatchingInlineSnapshot(`
		  "[
		    {
		      "code": "custom",
		      "path": [],
		      "message": "INVALID_TAG_FORMAT_ERROR"
		    }
		  ]"
		`);
	});

	it("fails validation for a string with special characters", () => {
		expect(() => schema.parse("invalid@kebab#case!")).toThrowErrorMatchingInlineSnapshot(`
		  "[
		    {
		      "code": "custom",
		      "path": [],
		      "message": "INVALID_TAG_FORMAT_ERROR"
		    }
		  ]"
		`);
	});

	it("validates a single-word kebab-case string", () => {
		expect(schema.parse("kebab")).toEqual("kebab");
	});
});
