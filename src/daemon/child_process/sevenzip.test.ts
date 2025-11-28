import { describe, expect, test } from "bun:test";
import { SevenzipErrors, spawnSevenzip } from "./sevenzip.ts";

describe("Sevenzip Child Process", () => {
	test("should return PropsError if executable path does not exist", async () => {
		const result = await spawnSevenzip({
			exePath: "nonexistent/7za.exe",
			archivePath: "test.7z",
			targetDir: "/tmp/extract",
			onProgress: () => {},
		});

		expect(result.isErr()).toBe(true);
		expect(result._unsafeUnwrapErr()).toBe(SevenzipErrors.PropsError);
	});

	test("should return PropsError if executable path is a directory", async () => {
		const result = await spawnSevenzip({
			exePath: "binaries",
			archivePath: "test.7z",
			targetDir: "/tmp/extract",
			onProgress: () => {},
		});

		expect(result.isErr()).toBe(true);
		expect(result._unsafeUnwrapErr()).toBe(SevenzipErrors.PropsError);
	});

	test("should return PropsError if archive path does not exist", async () => {
		const result = await spawnSevenzip({
			exePath: "binaries/7za.exe",
			archivePath: "nonexistent/test.7z",
			targetDir: "/tmp/extract",
			onProgress: () => {},
		});

		expect(result.isErr()).toBe(true);
		expect(result._unsafeUnwrapErr()).toBe(SevenzipErrors.PropsError);
	});
});
