import "./tui/index.tsx";
import "./log4js.ts";
import * as assert from "node:assert";
import { serve } from "bun";
import { getLogger } from "log4js";
import appConfig, { CONFIG_FILE_PATH, configParseResult } from "./config.ts";
import { SEVEN_ZIP_BINARIES, WGET_BINARIES } from "./constants.ts";
import { HonoApplication } from "./hono/HonoApplication.ts";
import { ProdApplication } from "./ProdApplication.ts";
import { startTui } from "./tui";
import { which } from "./utils/which.ts";

const logger = getLogger("bootstrap");

// Check for config errors first
if (!configParseResult.success) {
	logger.error("❌ Configuration validation failed. Please fix the following errors:");

	for (const issue of configParseResult.error.issues) {
		const path = issue.path.join(".");
		logger.error(`  • [${path}] ${issue.message}`);
	}

	logger.error("\nPlease update your config.toml file and restart the daemon.");

	// If TUI is requested, we need to check the raw config
	// Since we can't trust the parsed config, check the raw TOML
	const rawConfig = Bun.TOML.parse(await Bun.file(CONFIG_FILE_PATH).text()) as any;
	const tuiEnabled = rawConfig?.app?.tui_enabled !== false; // Default to true

	if (tuiEnabled) {
		// Display errors in TUI
		logger.info("TUI is enabled. Displaying errors in terminal UI...");
		// We'll need to show errors in a simple way since full TUI won't work without valid config
		// For now, just show in logs and exit
		logger.error("Cannot start TUI with invalid configuration. Please fix the errors above.");
	}

	process.exit(1);
}

logger.info("✓ Configuration validated successfully");

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

if (appConfig.app.tui_enabled) {
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
