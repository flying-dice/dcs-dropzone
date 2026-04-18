import "./log4js.ts";
import { serve } from "bun";
import { getLogger } from "log4js";
import { appConfig } from "./config";
import { application } from "./hono/ApplicationFactory.ts";
import { app } from "./hono/app.ts";
import index from "./ui/index.html";

const logger = getLogger("bootstrap");

logger.info(`🌍 DCS Dropzone Registry Webapp Starting...`);

await application.init();

logger.debug("Starting Bun server...");
const bunServer = serve({
	port: appConfig.port,
	development: appConfig.enableServeDevelopment,
	routes: {
		"/*": index,
		"/auth": app.fetch,
		"/auth/**": app.fetch,
		"/api": app.fetch,
		"/api/**": app.fetch,
		"/v3/api-docs": app.fetch,
	},
});

logger.info(`🚀 Server running at ${bunServer.url}`);

logger.debug("Bootstrap complete!");

process.on("exit", async (code) => {
	logger.info(`Process exiting with code: ${code}`);
});
