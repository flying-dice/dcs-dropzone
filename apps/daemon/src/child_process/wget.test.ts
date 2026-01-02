import "../__tests__/log4js.ts";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getLogger } from "log4js";
import { getAllPathsForTree } from "../__tests__/utils.ts";
import { spawnWget, WgetErrors } from "./wget.ts";

const logger = getLogger("wget.test.ts");

describe("Wget Child Process", () => {
	let tempDir: string;
	let exePath: string;

	beforeEach(() => {
		exePath = process.env.WGET_PATH || "bin/wget.exe";
		tempDir = mkdtempSync(join(tmpdir(), "dcs-dropzone__"));
		logger.info("Running test with temporary directory:", tempDir);
	});

	afterEach(() => {
		logger.info("Removing temporary directory:", getAllPathsForTree(tempDir));
		rmSync(tempDir, { recursive: true });
	});

	test("should return PropsError if executable path does not exist", async () => {
		const result = await spawnWget({
			exePath: join(tmpdir(), "wget.exe"),
			url: "https://getsamplefiles.com/download/zip/sample-1.zip",
			target: tempDir,
			onProgress: () => {},
		});

		expect(result.isErr()).toBe(true);
		expect(result._unsafeUnwrapErr()).toBe(WgetErrors.PropsError);
	});

	test("should download file successfully", async () => {
		const result = await spawnWget({
			exePath,
			url: "https://getsamplefiles.com/download/zip/sample-1.zip",
			target: tempDir,
			onProgress: () => {},
		});

		expect(result.isOk()).toBe(true);
		const filePath = result._unsafeUnwrap();
		expect(filePath).toBe(join(tempDir, "sample-1.zip"));
	});
});
