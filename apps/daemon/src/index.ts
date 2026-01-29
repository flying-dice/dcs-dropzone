import "./log4js.ts";
import { serve } from "bun";
import { getLogger } from "log4js";
import appConfig from "./config";
import { HonoApplication } from "./hono/HonoApplication.ts";
import { ProdApplication } from "./ProdApplication.ts";
import { WebviewWorker } from "./webview";
import index from "./wui/index.html";

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
const honoApp = await HonoApplication.build(app);

logger.debug("Starting Bun server...");
const bunServer = serve({
	hostname: appConfig.server.host,
	port: appConfig.server.port,
	development: process.env.NODE_ENV !== "production",
	routes: {
		"/*": index,
		"/api": honoApp.fetch,
		"/api/**": honoApp.fetch,
		"/v3/api-docs": honoApp.fetch,
	},
});

logger.info(`🚀 Server running at ${bunServer.url}`);

const webviewWorker: WebviewWorker = new WebviewWorker({
	debug: process.env.NODE_ENV !== "production",
});

webviewWorker.onMessage(async (message) => {
	switch (message.type) {
		case "window-closed":
			logger.info("Webview window closed by user.");
			await handleGracefulShutdown();
			break;
		default:
			logger.warn("Unknown message type from webview worker:", message);
	}
});

webviewWorker.onError(async (error: ErrorEvent) => {
	logger.error("Error in webview worker:", error.message);
	await handleGracefulShutdown();
});

async function handleGracefulShutdown() {
	logger.info("Graceful shutdown initiated...");
	logger.debug("Terminating webview worker...");
	webviewWorker.terminate();

	logger.debug("Stopping Bun server...");
	await bunServer.stop(true);

	logger.debug("Closing application...");
	app.close();

	logger.info("Shutdown complete.");
}

logger.debug("Bootstrap complete!");

process.on("SIGINT", async () => {
	logger.info("SIGINT received, shutting down...");
	await handleGracefulShutdown();
});

process.on("exit", async (code) => {
	logger.info(`Process exiting with code ${code}`);
});
