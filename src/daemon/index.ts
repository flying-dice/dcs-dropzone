import { serve } from "bun";
import { app } from "./app.ts";
import appConfig from "./app-config.ts";
import { getLogger } from "./Logger.ts";

console.info(`🌍 DCS Dropzone Daemon Starting...`);

const logger = getLogger("index");

const server = serve({
	hostname: appConfig.server.host,
	port: appConfig.server.port,
	development: process.env.NODE_ENV !== "production",
	routes: {
		"/api": app.fetch,
		"/api/**": app.fetch,
		"/v3/api-docs": app.fetch,
	},
});

logger.info(`🚀 Server running at ${server.url}`);
