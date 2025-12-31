import "./tui/index.tsx";
import "./log4js.ts";
import { serve } from "bun";
import { getLogger } from "log4js";
import { Drizzle7zExtractQueue } from "./adapters/Drizzle7zExtractQueue.ts";
import { DrizzleAttributesRepository } from "./adapters/DrizzleAttributesRepository.ts";
import { DrizzleReleaseRepository } from "./adapters/DrizzleReleaseRepository.ts";
import { DrizzleWgetDownloadQueue } from "./adapters/DrizzleWgetDownloadQueue.ts";
import { LocalFileSystem } from "./adapters/LocalFileSystem.ts";
import { Application } from "./application/Application.ts";
import appConfig from "./config.ts";
import applicationConfig from "./config.ts";
import Database from "./database";
import { HonoApplication } from "./hono/HonoApplication.ts";
import { startTui } from "./tui";

const logger = getLogger("bootstrap");

logger.debug("Bootstrapping application...");
logger.debug("Creating database and Repositories...");
const db = Database(applicationConfig.database);
const attributesRepository = new DrizzleAttributesRepository({ db });
const releaseRepository = new DrizzleReleaseRepository({ db });

logger.debug("Creating Download and Extract Queues...");
const downloadQueue = new DrizzleWgetDownloadQueue({
	db,
	wgetExecutablePath: applicationConfig.binaries.wget,
});

const extractQueue = new Drizzle7zExtractQueue({
	db,
	downloadQueue,
	sevenzipExecutablePath: applicationConfig.binaries.sevenzip,
});

logger.debug("Creating file system service...");
const fileSystem = new LocalFileSystem();

logger.debug("Creating Application instance...");
const app = new Application({
	dcsPaths: {
		DCS_INSTALL_DIR: applicationConfig.dcs.dcs_install_dir,
		DCS_WORKING_DIR: applicationConfig.dcs.dcs_working_dir,
	},
	dropzoneModsFolder: applicationConfig.app.mods_dir,
	generateUuid: () => crypto.randomUUID(),
	attributesRepository,
	releaseRepository,
	downloadQueue,
	extractQueue,
	fileSystem,
});

logger.debug("Creating Hono application wrapper...");
const honoApp = new HonoApplication(app);

logger.debug("Starting Bun server...");
const bunServer = serve({
	hostname: appConfig.server.host,
	port: appConfig.server.port,
	development: process.env.NODE_ENV !== "production",
	routes: {
		"/api": honoApp.fetch,
		"/api/**": honoApp.fetch,
		"/v3/api-docs": honoApp.fetch,
	},
});

logger.info(`🚀 Server running at ${bunServer.url}`);

if (process.stdin.isTTY) {
	logger.info("Starting TUI...");
	await startTui(app, async () => {
		logger.info("TUI destroyed, exiting...");
		process.exit();
	});
}

logger.debug("Bootstrap complete!");

process.on("exit", (code) => {
	logger.info(`Process exiting with code: ${code}`);
});
