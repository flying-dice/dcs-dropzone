import { serve } from "bun";
import { ensureDirSync } from "fs-extra";
import { app } from "./app.ts";
import appConfig, { WGET_EXECUTABLE_PATH } from "./app-config.ts";
import { getLogger } from "./logger.ts";

console.info(`🌍 DCS Dropzone Daemon Starting...`);

const logger = getLogger("index");

logger.debug("Installing Binaries");
ensureDirSync(appConfig.binaries.target_directory);

logger.debug("Downloading wget binary");
const wget = await Bun.fetch(appConfig.binaries.wget);
logger.debug("Writing wget binary to target directory");
await Bun.write(WGET_EXECUTABLE_PATH, wget);

logger.debug("Finished installing binaries");

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
