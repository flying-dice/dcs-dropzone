import "../__tests__/log4js.ts";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getLogger } from "log4js";
import { getAllPathsForTree } from "../__tests__/utils.ts";
import { SevenzipErrors, spawnSevenzip } from "./sevenzip.ts";

const logger = getLogger("sevenzip.test.ts");

describe("Sevenzip Child Process", () => {
	let tempDir: string;
	let exePath: string;

	beforeEach(() => {
		exePath = process.env.SEVEN7_PATH || "bin/7za.exe";
		tempDir = mkdtempSync(join(tmpdir(), "dcs-dropzone__"));
		logger.info("Running test with temporary directory:", tempDir);
	});

	afterEach(() => {
		logger.info("Removing temporary directory:", getAllPathsForTree(tempDir));
		rmSync(tempDir, { recursive: true });
	});

	test("should return PropsError if executable path does not exist", async () => {
		const result = await spawnSevenzip({
			exePath: join(tmpdir(), "7za.exe"),
			archivePath: "test.7z",
			targetDir: tempDir,
			onProgress: () => {},
		});

		expect(result.isErr()).toBe(true);
		expect(result._unsafeUnwrapErr()).toBe(SevenzipErrors.PropsError);
	});

	test("should return PropsError if executable path is a directory", async () => {
		const result = await spawnSevenzip({
			exePath: tmpdir(),
			archivePath: "test.7z",
			targetDir: tempDir,
			onProgress: () => {},
		});

		expect(result.isErr()).toBe(true);
		expect(result._unsafeUnwrapErr()).toBe(SevenzipErrors.PropsError);
	});

	test("should return PropsError if archive path does not exist", async () => {
		const result = await spawnSevenzip({
			exePath,
			archivePath: "nonexistent/test.7z",
			targetDir: tempDir,
			onProgress: () => {},
		});

		expect(result.isErr()).toBe(true);
		expect(result._unsafeUnwrapErr()).toBe(SevenzipErrors.PropsError);
	});
});
