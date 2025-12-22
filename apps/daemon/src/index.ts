import "./tui/index.tsx";
import "./log4js.ts";
import { serve } from "bun";
import { getLogger } from "log4js";
import Application from "./Application.ts";
import appConfig from "./ApplicationConfig.ts";

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
