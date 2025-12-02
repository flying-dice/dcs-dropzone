import { describe, expect, test } from "bun:test";
import { secureJoin } from "./secureJoin";

describe("secureJoin", () => {
	test("returns the resolved path when child is within root", () => {
		const root = "/home/user";
		const child = "documents/file.txt";
		const result = secureJoin(root, child);
		expect(result).toBe("/home/user/documents/file.txt");
	});

	test("throws an error when child escapes root using '..'", () => {
		const root = "/home/user";
		const child = "../etc/passwd";
		expect(() => secureJoin(root, child)).toThrow("Resolved path escapes root: ../etc/passwd");
	});

	test("throws an error when child escapes root using absolute path", () => {
		const root = "/home/user";
		const child = "/etc/passwd";
		expect(() => secureJoin(root, child)).toThrow("Resolved path escapes root: /etc/passwd");
	});

	test("throws an error when child escapes root using Windows drive letter", () => {
		const root = "C:\\home\\user";
		const child = "D:\\other\\file.txt";
		expect(() => secureJoin(root, child)).toThrow("Resolved path escapes root: D:\\other\\file.txt");
	});

	test("returns the resolved path when child is the root itself", () => {
		const root = "/home/user";
		const child = ".";
		const result = secureJoin(root, child);
		expect(result).toBe("/home/user");
	});

	test("returns the resolved path when child is an empty string", () => {
		const root = "/home/user";
		const child = "";
		const result = secureJoin(root, child);
		expect(result).toBe("/home/user");
	});
});
