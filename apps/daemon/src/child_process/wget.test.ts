import "../__tests__/log4js.ts";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getLogger } from "log4js";
import { TestTempDir } from "../__tests__/TestTempDir.ts";
import { SYSTEM_WGET_PATH } from "../__tests__/utils.ts";
import { spawnWget, WgetErrors } from "./wget.ts";

const logger = getLogger("wget.test.ts");

describe("Wget Child Process", () => {
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
		const result = await spawnWget({
			exePath: join(tmpdir(), "wget.exe"),
			url: "https://github.com/flying-dice/hello-world-mod/raw/refs/heads/main/sample-1.zip",
			target: tempDir.path,
			onProgress: () => {},
		});

		expect(result.isErr()).toBe(true);
		expect(result._unsafeUnwrapErr()).toBe(WgetErrors.PropsError);
	});

	test("should download file successfully", async () => {
		const result = await spawnWget({
			exePath: SYSTEM_WGET_PATH,
			url: "https://github.com/flying-dice/hello-world-mod/raw/refs/heads/main/sample-1.zip",
			target: tempDir.path,
			onProgress: () => {},
		});

		expect(result.isOk()).toBe(true);
		const filePath = result._unsafeUnwrap();
		expect(filePath).toBe(tempDir.join("sample-1.zip"));
	});
});
