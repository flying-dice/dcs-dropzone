import "../__tests__/log4js.ts";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getLogger } from "log4js";
import { TestTempDir } from "../__tests__/TestTempDir.ts";
import { SYSTEM_7ZIP_PATH } from "../__tests__/utils.ts";
import { SevenzipErrors, spawnSevenzip } from "./sevenzip.ts";

const logger = getLogger("sevenzip.test.ts");

describe("Sevenzip Child Process", () => {
	let tempDir: TestTempDir;

	beforeEach(() => {
		tempDir = new TestTempDir();
		logger.info("Running test with temporary directory:", tempDir);
	});

	afterEach(() => {
		logger.info("Removing temporary directory:", tempDir.glob("**/*"));
		tempDir.cleanup();
	});

	test("should return PropsError if executable path does not exist", async () => {
		const result = await spawnSevenzip({
			exePath: join(tmpdir(), "7za.exe"),
			archivePath: "test.7z",
			targetDir: tempDir.path,
			onProgress: () => {},
		});

		expect(result.isErr()).toBe(true);
		expect(result._unsafeUnwrapErr()).toBe(SevenzipErrors.PropsError);
	});

	test("should return PropsError if executable path is a directory", async () => {
		const result = await spawnSevenzip({
			exePath: tmpdir(),
			archivePath: "test.7z",
			targetDir: tempDir.path,
			onProgress: () => {},
		});

		expect(result.isErr()).toBe(true);
		expect(result._unsafeUnwrapErr()).toBe(SevenzipErrors.PropsError);
	});

	test("should return PropsError if archive path does not exist", async () => {
		const result = await spawnSevenzip({
			exePath: SYSTEM_7ZIP_PATH,
			archivePath: "nonexistent/test.7z",
			targetDir: tempDir.path,
			onProgress: () => {},
		});

		expect(result.isErr()).toBe(true);
		expect(result._unsafeUnwrapErr()).toBe(SevenzipErrors.PropsError);
	});
});
