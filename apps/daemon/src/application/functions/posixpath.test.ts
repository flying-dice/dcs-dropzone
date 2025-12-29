import { describe, expect, it } from "bun:test";
import { posixpath } from "./posixpath.ts";

describe("posixpath", () => {
	it("converts backslashes to forward slashes", () => {
		const result = posixpath("C:\\path\\to\\file");
		expect(result).toBe("C:/path/to/file");
	});

	it("returns the same path if no backslashes are present", () => {
		const result = posixpath("C:/path/to/file");
		expect(result).toBe("C:/path/to/file");
	});

	it("handles empty string input", () => {
		const result = posixpath("");
		expect(result).toBe("");
	});

	it("handles paths with mixed slashes", () => {
		const result = posixpath("C:\\path/to\\file");
		expect(result).toBe("C:/path/to/file");
	});
});
