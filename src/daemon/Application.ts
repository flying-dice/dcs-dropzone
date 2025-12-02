import { getLogger } from "log4js";
import { SymbolicLinkDestRoot } from "../common/data.ts";
import applicationConfig from "./ApplicationConfig.ts";
import { db } from "./database";
import { DownloadQueue } from "./queues/DownloadQueue.ts";
import { ExtractQueue } from "./queues/ExtractQueue.ts";
import { createServer } from "./Server.ts";
import { PathService } from "./services/PathService.ts";

const logger = getLogger("Application");

const pathService = new PathService(
	{
		[SymbolicLinkDestRoot.DCS_INSTALL_DIR]: applicationConfig.dcs.dcs_install_dir,
		[SymbolicLinkDestRoot.DCS_WORKING_DIR]: applicationConfig.dcs.dcs_working_dir,
	},
	process.cwd(),
);

logger.debug("Setting up database connection");
const _db = db(applicationConfig.database);
logger.debug("Database connection established");

const downloadQueue = new DownloadQueue({
	db: _db,
	wgetExecutablePath: applicationConfig.binaries.wget,
	maxRetries: 3,
});

const extractQueue = new ExtractQueue({
	db: _db,
	sevenzipExecutablePath: applicationConfig.binaries.sevenzip,
	maxRetries: 3,
	downloadQueue,
});

logger.debug("Services initialized");

const server = createServer({
	downloadQueue,
	extractQueue,
	pathService,
	db: _db,
});

export default {
	server,
	downloadQueue,
	extractQueue,
};
