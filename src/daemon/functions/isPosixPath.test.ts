import { describe, expect, test } from "bun:test";
import { isPosixPath } from "./isPosixPath";

describe("isPosixPath", () => {
	test("returns true for a Unix-style absolute path", () => {
		const path = "/home/user/documents";
		const result = isPosixPath(path);
		expect(result).toBe(true);
	});

	test("returns true for a path containing a colon followed by a slash", () => {
		const path = "C:/Windows/System32";
		const result = isPosixPath(path);
		expect(result).toBe(true);
	});

	test("returns false for a relative path without a colon", () => {
		const path = "documents/file.txt";
		const result = isPosixPath(path);
		expect(result).toBe(false);
	});

	test("returns false for an empty string", () => {
		const path = "";
		const result = isPosixPath(path);
		expect(result).toBe(false);
	});

	test("returns true for a root-only Unix-style path", () => {
		const path = "/";
		const result = isPosixPath(path);
		expect(result).toBe(true);
	});
});
