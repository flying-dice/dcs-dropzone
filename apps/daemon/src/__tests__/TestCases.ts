import { getLogger } from "log4js";
import type { Application } from "../application/Application.ts";
import { ProdApplication } from "../ProdApplication.ts";
import { TestApplication } from "./TestApplication.ts";
import { TestTempDir } from "./TestTempDir.ts";
import { SYSTEM_7ZIP_PATH, SYSTEM_WGET_PATH } from "./utils.ts";

const logger = getLogger("TestCases");

export type TestCase = { label: string; build: () => { app: Application; tempDir: TestTempDir } };

export const TestCases: TestCase[] = [
	{
		label: "TestApplication",
		build: () => ({
			app: new TestApplication(),
			tempDir: new TestTempDir(),
		}),
	},
	{
		label: "ProdApplication",
		build: () => {
			const tempDir = new TestTempDir();
			logger.info("Creating ProdApplication test case with temporary directory:", tempDir.path);

			return {
				app: new ProdApplication({
					databaseUrl: ":memory:",
					wgetExecutablePath: SYSTEM_WGET_PATH,
					sevenzipExecutablePath: SYSTEM_7ZIP_PATH,
					dropzoneModsFolder: tempDir.join("dcs-dropzone", "mods"),
					dcsPaths: {
						DCS_WORKING_DIR: tempDir.join("dcs-dropzone", "dcs", "working"),
						DCS_INSTALL_DIR: tempDir.join("dcs-dropzone", "dcs", "install"),
					},
				}),
				tempDir,
			};
		},
	},
];
