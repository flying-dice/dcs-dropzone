import "./tui/index.tsx";
import "./log4js.ts";
import { serve } from "bun";
import { getLogger } from "log4js";
import appConfig from "./config";
import applicationConfig from "./config";
import { HonoApplication } from "./hono/HonoApplication.ts";
import { ProdApplication } from "./ProdApplication.ts";
import { startTui } from "./tui";

const logger = getLogger("bootstrap");

logger.debug("Creating ProdApplication instance...");
const app = new ProdApplication({
	databaseUrl: appConfig.database.url,
	wgetExecutablePath: appConfig.binaries.wget,
	sevenZipExecutablePath: appConfig.binaries.sevenzip,
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
