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

			const app = new ProdApplication({
				databaseUrl: ":memory:",
				wgetExecutablePath: SYSTEM_WGET_PATH,
				sevenZipExecutablePath: SYSTEM_7ZIP_PATH,
			});

			app.settings.setDropzoneModsDir(tempDir.join("dcs-dropzone", "mods"));
			app.settings.setDcsWorkingDir(tempDir.join("dcs-dropzone", "dcs", "working"));
			app.settings.setDcsInstallDir(tempDir.join("dcs-dropzone", "dcs", "install"));

			return { app, tempDir };
		},
	},
];
