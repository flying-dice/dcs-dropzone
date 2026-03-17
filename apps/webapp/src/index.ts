import "./log4js.ts";
import { serve } from "bun";
import { getLogger } from "log4js";
import { appConfig } from "./AppConfig.ts";
import type { AuthenticationProvider } from "./authentication/AuthenticationProvider.ts";
import { GithubAuthenticationProvider } from "./authentication/GithubAuthenticationProvider.ts";
import { MockAuthService } from "./authentication/MockAuthService.ts";
import { HonoApplication } from "./hono/HonoApplication.ts";
import { ProdApplication } from "./ProdApplication.ts";
import index from "./ui/index.html";

const logger = getLogger("bootstrap");

logger.info(`🌍 DCS Dropzone Registry Webapp Starting...`);

logger.debug("Creating ProdApplication instance...");
const app = new ProdApplication({ mongoUri: appConfig.mongoUri });

await app.init();

logger.debug("Creating Authentication provider...");
let authenticationProvider: AuthenticationProvider | null = null;

if (appConfig.authServiceGh) {
	authenticationProvider = new GithubAuthenticationProvider(appConfig.authServiceGh);
}

if (!authenticationProvider) {
	authenticationProvider = new MockAuthService();
}

logger.debug("Creating Hono application wrapper...");
const honoApp = await HonoApplication.build(app, authenticationProvider);

logger.debug("Starting Bun server...");
const bunServer = serve({
	port: appConfig.port,
	development: appConfig.enableServeDevelopment,
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

process.on("exit", async (code) => {
	logger.info(`Process exiting with code: ${code}`);
});
