import "./log4js.ts";
import { serve } from "bun";
import { getLogger } from "log4js";
import appConfig from "./ApplicationConfig.ts";
import index from "./client/index.html";
import { HonoApplication } from "./hono/HonoApplication.ts";
import { ProdApplication } from "./ProdApplication.ts";

const logger = getLogger("bootstrap");

logger.info(`🌍 DCS Dropzone Registry Webapp Starting...`);
logger.debug("Creating ProdApplication instance...");
const app = new ProdApplication({
	githubClientId: "",
	githubClientSecret: "",
	githubRedirectUrl: "",
	mongoUri: appConfig.mongoUri,
});

await app.init();

logger.debug("Creating Hono application wrapper...");
const honoApp = new HonoApplication(app);

logger.debug("Starting Bun server...");
const bunServer = serve({
	port: appConfig.port,
	development: process.env.NODE_ENV !== "production",
	routes: {
		"/*": index,
		"/auth": honoApp.fetch,
		"/auth/**": honoApp.fetch,
		"/api": honoApp.fetch,
		"/api/**": honoApp.fetch,
		"/v3/api-docs": honoApp.fetch,
	},
});

logger.info(`🚀 Server running at ${bunServer.url}`);

logger.debug("Bootstrap complete!");

process.on("exit", (code) => {
	logger.info(`Process exiting with code: ${code}`);
});
