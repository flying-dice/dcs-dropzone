import "./tui/index.tsx";
import "./log4js.ts";
import * as assert from "node:assert";
import { serve } from "bun";
import { getLogger } from "log4js";
import appConfig from "./config.ts";
import applicationConfig from "./config.ts";
import { SEVEN_ZIP_BINARIES, WGET_BINARIES } from "./constants.ts";
import { HonoApplication } from "./hono/HonoApplication.ts";
import { ProdApplication } from "./ProdApplication.ts";
import { startTui } from "./tui";
import { which } from "./utils/which.ts";

const logger = getLogger("bootstrap");

logger.info("Searching for application dependencies, wget and 7zip...");
const wgetExecutablePath = appConfig.binaries.wget ?? WGET_BINARIES.map(which).find(Boolean);
const sevenZipExecutablePath = appConfig.binaries.sevenzip ?? SEVEN_ZIP_BINARIES.map(which).find(Boolean);

assert.ok(
	wgetExecutablePath,
	`Could not find 'wget' executable. Please install wget or specify its path in the configuration.`,
);

assert.ok(
	sevenZipExecutablePath,
	`Could not find 7zip executable (tried: ${SEVEN_ZIP_BINARIES.join(", ")}). Please install 7zip or specify its path in the configuration.`,
);

logger.debug("Creating ProdApplication instance...");
const app = new ProdApplication({
	databaseUrl: appConfig.database.url,
	wgetExecutablePath,
	sevenZipExecutablePath,
	dropzoneModsFolder: appConfig.app.mods_dir,
	dcsPaths: {
		DCS_WORKING_DIR: appConfig.dcs.dcs_working_dir,
		DCS_INSTALL_DIR: appConfig.dcs.dcs_install_dir,
	},
});

logger.debug("Creating Hono application wrapper...");
const honoApp = new HonoApplication(app);

logger.debug("Starting Bun server...");
const bunServer = serve({
	hostname: appConfig.server.host,
	port: appConfig.server.port,
	development: process.env.NODE_ENV !== "production",
	routes: {
		"/api": honoApp.fetch,
		"/api/**": honoApp.fetch,
		"/v3/api-docs": honoApp.fetch,
	},
});

logger.info(`🚀 Server running at ${bunServer.url}`);

if (applicationConfig.app.tui_enabled) {
	logger.info("Starting TUI...");
	await startTui(app, async () => {
		logger.info("TUI destroyed, exiting...");
		process.exit();
	});
}

logger.debug("Bootstrap complete!");

process.on("exit", (code) => {
	logger.info(`Process exiting with code: ${code}`);
});
