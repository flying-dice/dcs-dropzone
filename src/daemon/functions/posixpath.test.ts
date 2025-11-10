import { describe, expect, test } from "bun:test";
import { posixpath } from "./posixpath";

describe("posixpath", () => {
	test("converts backslashes to forward slashes", () => {
		const result = posixpath("C:\\path\\to\\file");
		expect(result).toBe("C:/path/to/file");
	});

	test("returns the same path if no backslashes are present", () => {
		const result = posixpath("C:/path/to/file");
		expect(result).toBe("C:/path/to/file");
	});

	test("handles empty string input", () => {
		const result = posixpath("");
		expect(result).toBe("");
	});

	test("handles paths with mixed slashes", () => {
		const result = posixpath("C:\\path/to\\file");
		expect(result).toBe("C:/path/to/file");
	});
});
