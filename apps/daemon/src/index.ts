import "./tui/index.tsx";
import "./log4js.ts";
import { serve } from "bun";
import { getLogger } from "log4js";
import { Application } from "./Application.ts";
import appConfig from "./ApplicationConfig.ts";
import { startTui } from "./tui";

const logger = getLogger("index");

const app = new Application();

const _server = serve({
	hostname: appConfig.server.host,
	port: appConfig.server.port,
	development: process.env.NODE_ENV !== "production",
	routes: {
		"/api": app.fetch,
		"/api/**": app.fetch,
		"/v3/api-docs": app.fetch,
	},
});

logger.info(`🚀 Server running at ${_server.url}`);

if (process.stdin.isTTY) {
	await startTui(
		{
			enableRelease: app.enableRelease,
			disableRelease: app.disableRelease,
			removeRelease: app.removeRelease,
		},
		async () => {
			logger.info("TUI destroyed, exiting...");
			process.exit();
		},
	);
}

process.on("exit", (code) => {
	logger.info(`Process exiting with code: ${code}`);
});
