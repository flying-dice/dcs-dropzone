import "./tui/index.tsx";
import "./log4js.ts";
import { serve } from "bun";
import { getLogger } from "log4js";
import appConfig from "./config";
import applicationConfig from "./config";
import { HonoApplication } from "./hono/HonoApplication.ts";
import { recentLoggingEvent$ } from "./log4js.ts";
import { ProdApplication } from "./ProdApplication.ts";
import { startTui } from "./tui";
import { WebviewWorker } from "./webview";

const APP_URL = "https://dcs-dropzone-container.flying-dice.workers.dev";

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

const webviewWorker: WebviewWorker = new WebviewWorker();

async function handleGracefulShutdown() {
	logger.info("Graceful shutdown initiated...");
	logger.debug("Terminating webview worker...");
	webviewWorker.terminate(APP_URL);

	logger.debug("Stopping Bun server...");
	await bunServer.stop();

	logger.debug("Closing application...");
	app.close();

	logger.info("Shutdown complete.");
}

if (applicationConfig.app.tui_enabled) {
	logger.info("Starting TUI...");
	await startTui({
		recentLoggingEvent$,
		release$: app.release$,
		onEnableRelease: (releaseId) => app.enableRelease(releaseId),
		onDisableRelease: (releaseId) => app.disableRelease(releaseId),
		onRemoveRelease: (releaseId) => app.disableRelease(releaseId),
		onOpenBrowser: () => {
			webviewWorker
				.open(APP_URL, {
					debug: process.env.NODE_ENV !== "production",
				})
				.match(
					() => {},
					(e) => {
						throw new Error(e);
					},
				);
		},
		onQuit: async () => {
			logger.info("Quit signal received from TUI, shutting down...");
			await handleGracefulShutdown();
		},
	});
}

logger.debug("Bootstrap complete!");

process.on("SIGINT", async () => {
	logger.info("SIGINT received, shutting down...");
	await handleGracefulShutdown();
});

process.on("exit", async (code) => {
	logger.info(`Process exiting with code ${code}`);
});
