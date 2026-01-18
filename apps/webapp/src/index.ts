import "./log4js.ts";
import { serve } from "bun";
import { getLogger } from "log4js";
import { MongoMemoryServer } from "mongodb-memory-server";
import appConfig from "./ApplicationConfig.ts";
import type { AuthenticationProvider } from "./authentication/AuthenticationProvider.ts";
import { GithubAuthenticationProvider } from "./authentication/GithubAuthenticationProvider.ts";
import { MockAuthService } from "./authentication/MockAuthService.ts";
import { MongoUrl } from "./database/MongoUrl.ts";
import { HonoApplication } from "./hono/HonoApplication.ts";
import { ProdApplication } from "./ProdApplication.ts";
import index from "./wui/index.html";

const logger = getLogger("bootstrap");

logger.info(`🌍 DCS Dropzone Registry Webapp Starting...`);
const mongoUrl = new MongoUrl(appConfig.mongoUri);
let mongoMemoryServer: MongoMemoryServer | null = null;

if (mongoUrl.isMemoryDatabase()) {
	logger.warn("⚠️  Using in-memory MongoDB instance. All data will be lost on shutdown.");
	mongoMemoryServer = await MongoMemoryServer.create({
		instance: { port: mongoUrl.port },
	});
	await mongoMemoryServer.ensureInstance();
}

logger.debug("Creating ProdApplication instance...");
const app = new ProdApplication({
	mongoUri:
		mongoUrl.isMemoryDatabase() && mongoMemoryServer ? mongoMemoryServer.getUri(mongoUrl.dbName) : appConfig.mongoUri,
});

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
const honoApp = new HonoApplication(app, authenticationProvider);

logger.debug("Starting Bun server...");
const bunServer = serve({
	port: appConfig.port,
	development: process.env.NODE_ENV !== "production",
	routes: {
		"/*": index,
		"/dcs-dropzone-daemon.tar": Bun.file("./dcs-dropzone-daemon.tar"),
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
	if (mongoMemoryServer) {
		logger.info("Stopping in-memory MongoDB server...");
		await mongoMemoryServer.stop();
	}
});
