import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { noop } from "lodash";
import { getLogger } from "log4js";
import type { Application } from "../application/Application.ts";
import { ProdApplication } from "../ProdApplication.ts";
import { TestApplication } from "./TestApplication.ts";
import { getAllPathsForTree } from "./utils.ts";

const logger = getLogger("TestCases");

export type TestCase = { label: string; build: () => { app: Application; cleanup: () => void } };

export const TestCases: TestCase[] = [
	{
		label: "TestApplication",
		build: () => ({
			app: new TestApplication(),
			cleanup: noop,
		}),
	},
	{
		label: "ProdApplication",
		build: () => {
			const testFolder = mkdtempSync(join(tmpdir(), "dcs-dropzone__"));
			logger.info("Creating ProdApplication test case with temporary directory:", testFolder);

			return {
				app: new ProdApplication({
					databaseUrl: ":memory:",
					wgetExecutablePath: process.env.WGET_PATH || "bin/wget.exe",
					sevenzipExecutablePath: process.env.SEVEN7_PATH || "bin/7za.exe",
					dropzoneModsFolder: join(testFolder, "dcs-dropzone", "mods"),
					dcsPaths: {
						DCS_WORKING_DIR: join(testFolder, "dcs-dropzone", "dcs", "working"),
						DCS_INSTALL_DIR: join(testFolder, "dcs-dropzone", "dcs", "install"),
					},
				}),
				cleanup: () => {
					logger.info("Removing temporary directory:", getAllPathsForTree(testFolder));
					rmSync(testFolder, { recursive: true });
				},
			};
		},
	},
];
