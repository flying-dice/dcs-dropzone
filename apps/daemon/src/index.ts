import "./log4js.ts";
import { serve } from "bun";
import { getLogger } from "log4js";
import { appConfig } from "./config";
import { application } from "./hono/ApplicationFactory.ts";
import { app } from "./hono/app.ts";
import index from "./ui/index.html";
import { WebviewWorker } from "./webview";

const logger = getLogger("bootstrap");

logger.debug("Starting Bun server...");
const bunServer = serve({
	hostname: appConfig.host,
	port: appConfig.port,
	development: appConfig.enableServeDevelopment,
	routes: {
		"/*": index,
		"/api": app.fetch,
		"/api/**": app.fetch,
		"/v3/api-docs": app.fetch,
	},
});

logger.info(`🚀 Server running at ${bunServer.url}`);

let webviewWorker: WebviewWorker | undefined;

if (appConfig.enableWebview) {
	webviewWorker = new WebviewWorker(appConfig.webviewWorkerModulePath);

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
}

async function handleGracefulShutdown() {
	logger.info("Graceful shutdown initiated...");
	logger.debug("Terminating webview worker...");
	webviewWorker?.terminate();

	logger.debug("Stopping Bun server...");
	await bunServer.stop(true);

	logger.debug("Closing application...");
	application.close();

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
