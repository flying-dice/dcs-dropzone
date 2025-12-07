import "./log4js.ts";
import { serve } from "bun";
import { getLogger } from "log4js";
import index from "./client/index.html";
import Application from "./server/Application.ts";
import appConfig from "./server/ApplicationConfig.ts";

const logger = getLogger("bootstrap");
logger.info(`🌍 DCS Dropzone Registry Webapp Starting...`);

const server = serve({
	port: appConfig.port,
	development: process.env.NODE_ENV !== "production",
	routes: {
		"/*": index,
		"/auth": Application.server.fetch,
		"/auth/**": Application.server.fetch,
		"/api": Application.server.fetch,
		"/api/**": Application.server.fetch,
		"/v3/api-docs": Application.server.fetch,
	},
});

logger.info(`🚀 Server running at ${server.url}`);
