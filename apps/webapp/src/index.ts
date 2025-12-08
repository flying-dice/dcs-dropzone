import "./server/infrastructure/log4js.ts";
import { serve } from "bun";
import { getLogger } from "log4js";
import index from "./client/index.html";
import appConfig from "./server/ApplicationConfig.ts";
import { hono } from "./server/infrastructure/http/hono.ts";

const logger = getLogger("bootstrap");
logger.info(`🌍 DCS Dropzone Registry Webapp Starting...`);

const server = serve({
	port: appConfig.port,
	development: process.env.NODE_ENV !== "production",
	routes: {
		"/*": index,
		"/auth": hono.fetch,
		"/auth/**": hono.fetch,
		"/api": hono.fetch,
		"/api/**": hono.fetch,
		"/v3/api-docs": hono.fetch,
	},
});

logger.info(`🚀 Server running at ${server.url}`);
