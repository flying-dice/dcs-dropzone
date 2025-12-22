import { resolve } from "node:path";
import { getLogger } from "log4js";
import { SymbolicLinkDestRoot } from "webapp";
import applicationConfig from "./ApplicationConfig.ts";
import { db } from "./database";
import AllDaemonReleases from "./observables/AllDaemonReleases.ts";
import getAllDaemonReleases from "./queries/GetAllDaemonReleases.ts";
import getDaemonInstanceId from "./queries/GetDaemonInstanceId.ts";
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
	resolve(applicationConfig.app.mods_dir),
);

logger.debug("Setting up database connection");
const _db = db(applicationConfig.database);

const daemonInstanceId = getDaemonInstanceId({ db: _db });

logger.debug("Database connection established");

const downloadQueue = new DownloadQueue({
	db: _db,
	wgetExecutablePath: applicationConfig.binaries.wget,
});
const extractQueue = new ExtractQueue({
	db: _db,
	downloadQueue,
	sevenzipExecutablePath: applicationConfig.binaries.sevenzip,
});

logger.debug("Services initialized");

AllDaemonReleases.$.next(getAllDaemonReleases({ db: _db }));
setInterval(() => {
	AllDaemonReleases.$.next(getAllDaemonReleases({ db: _db }));
}, 1000);

const server = createServer({
	daemonInstanceId,
	downloadQueue,
	extractQueue,
	pathService,
	db: _db,
});

export default {
	server,
	downloadQueue,
	extractQueue,
	db: _db,
	pathService,
};
