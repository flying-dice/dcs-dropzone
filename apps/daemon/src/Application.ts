import {resolve} from "node:path";
import {getLogger} from "log4js";
import {SymbolicLinkDestRoot} from "webapp";
import applicationConfig from "./ApplicationConfig.ts";
import {db} from "./database";
import AllDaemonReleases from "./observables/AllDaemonReleases.ts";
import {DownloadQueue} from "./queues/DownloadQueue.ts";
import {ExtractQueue} from "./queues/ExtractQueue.ts";
import {DrizzleGetReleaseAssetsForReleaseId} from "./repository/impl/DrizzleGetReleaseAssetsForReleaseId.ts";
import {DrizzleGetSymbolicLinksForReleaseId} from "./repository/impl/DrizzleGetSymbolicLinksForReleaseId.ts";
import {DrizzleSaveModAndReleaseData} from "./repository/impl/DrizzleSaveModAndReleaseData.ts";
import {DrizzleSetInstalledPathForLinkId} from "./repository/impl/DrizzleSetInstalledPathToNullForLinkId.ts";
import {AddRelease} from "./services/AddRelease.ts";
import {DisableRelease} from "./services/DisableRelease.ts";
import getAllDaemonReleases from "./services/GetAllDaemonReleases.ts";
import getDaemonInstanceId from "./services/GetDaemonInstanceId.ts";
import {PathService} from "./services/PathService.ts";
import regenerateMissionScriptingFiles from "./services/RegenerateMissionScriptingFiles.ts";
import {ResolveReleaseDir} from "./services/ResolveReleaseDir.ts";
import {EnableRelease} from "./services/EnableRelease.ts";

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

const getReleaseAssetsForReleaseId = new DrizzleGetReleaseAssetsForReleaseId({ db: _db });
const saveModAndReleaseData = new DrizzleSaveModAndReleaseData({ db: _db });
const getSymbolicLinksForReleaseId = new DrizzleGetSymbolicLinksForReleaseId({ db: _db });
const setInstalledPathForLinkId = new DrizzleSetInstalledPathForLinkId({ db: _db });

const regenerateMissionScriptFilesHandler = () => regenerateMissionScriptingFiles({ db: _db, pathService });

const resolveReleaseDir = new ResolveReleaseDir({ dropzoneModsFolder: applicationConfig.app.mods_dir });

const addRelease = new AddRelease({
	saveModAndReleaseData,
	getReleaseAssetsForReleaseId,
	extractQueue,
	downloadQueue,
	resolveReleaseDir,
});

const disableRelease = new DisableRelease({
	getSymbolicLinksForReleaseId,
    setInstalledPathForLinkId,
	regenerateMissionScriptFilesHandler,
});

const enableRelease = new EnableRelease({
    regenerateMissionScriptFilesHandler,
    setInstalledPathForLinkId,
    getSymbolicLinksForReleaseId,
    pathService,
});

export default {
	daemonInstanceId,
	downloadQueue,
	extractQueue,
	db: _db,
	pathService,
	resolveReleaseDir,
	addRelease,
	disableRelease,
    enableRelease
};
