import { serve } from "bun";
import Application from "./Application.ts";
import appConfig from "./ApplicationConfig.ts";
import { getLogger } from "./Logger.ts";

console.info(`🌍 DCS Dropzone Daemon Starting...`);

const logger = getLogger("index");

const server = serve({
	hostname: appConfig.server.host,
	port: appConfig.server.port,
	development: process.env.NODE_ENV !== "production",
	routes: {
		"/api": Application.server.fetch,
		"/api/**": Application.server.fetch,
		"/v3/api-docs": Application.server.fetch,
	},
});

logger.info(`🚀 Server running at ${server.url}`);
