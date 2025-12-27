import "./tui/index.tsx";
import "./log4js.ts";
import { serve } from "bun";
import { getLogger } from "log4js";
import appConfig from "./ApplicationConfig.ts";
import { server } from "./Server.ts";
import { startTui } from "./tui";

const logger = getLogger("index");

const _server = serve({
	hostname: appConfig.server.host,
	port: appConfig.server.port,
	development: process.env.NODE_ENV !== "production",
	routes: {
		"/api": server.fetch,
		"/api/**": server.fetch,
		"/v3/api-docs": server.fetch,
	},
});

logger.info(`🚀 Server running at ${_server.url}`);

await startTui(async () => {
	logger.info("TUI destroyed, exiting...");
	process.exit();
});

process.on("exit", (code) => {
	logger.info(`Process exiting with code: ${code}`);
});
