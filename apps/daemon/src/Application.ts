import { jsonErrorTransformer } from "@packages/hono/jsonErrorTransformer";
import { requestResponseLogger } from "@packages/hono/requestResponseLogger";
import { Scalar } from "@scalar/hono-api-reference";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import { openAPIRouteHandler } from "hono-openapi";
import { getLogger } from "log4js";
import { SymbolicLinkDestRoot } from "webapp";
import applicationConfig from "./ApplicationConfig.ts";
import downloads from "./api/downloads.ts";
import health from "./api/health.ts";
import toggle from "./api/toggle.ts";
import Database from "./database";
import { DrizzleDeleteModAndReleaseForReleaseId } from "./database/impl/DrizzleDeleteModAndReleaseForReleaseId.ts";
import { DrizzleGetAllReleases } from "./database/impl/DrizzleGetAllReleases.ts";
import { DrizzleGetDaemonInstanceId } from "./database/impl/DrizzleGetDaemonInstanceId.ts";
import { DrizzleGetDownloadJobsForReleaseAssetId } from "./database/impl/DrizzleGetDownloadJobsForReleaseAssetId.ts";
import { DrizzleGetExtractJobsForReleaseAssetId } from "./database/impl/DrizzleGetExtractJobsForReleaseAssetId.ts";
import { DrizzleGetMissionScriptsByRunOn } from "./database/impl/DrizzleGetMissionScriptsByRunOn.ts";
import { DrizzleGetMissionScriptsForReleaseId } from "./database/impl/DrizzleGetMissionScriptsForReleaseId.ts";
import { DrizzleGetReleaseAssetsForReleaseId } from "./database/impl/DrizzleGetReleaseAssetsForReleaseId.ts";
import { DrizzleGetSymbolicLinksForReleaseId } from "./database/impl/DrizzleGetSymbolicLinksForReleaseId.ts";
import { DrizzleSaveDaemonInstanceId } from "./database/impl/DrizzleSaveDaemonInstanceId.ts";
import { DrizzleSaveModAndRelease } from "./database/impl/DrizzleSaveModAndRelease.ts";
import { DrizzleSetInstalledPathForLinkId } from "./database/impl/DrizzleSetInstalledPathToNullForLinkId.ts";
import AllDaemonReleases from "./observables/AllDaemonReleases.ts";
import { DownloadQueue } from "./queues/DownloadQueue.ts";
import { ExtractQueue } from "./queues/ExtractQueue.ts";
import { _EnsureDir } from "./services/_EnsureDir.ts";
import { _EnsureSymlink } from "./services/_EnsureSymlink.ts";
import { _RemoveDir } from "./services/_RemoveDir.ts";
import { _ResolveReleasePath } from "./services/_ResolveReleasePath.ts";
import { _ResolveSymbolicLinkPath } from "./services/_ResolveSymbolicLinkPath.ts";
import { _WriteFile } from "./services/_WriteFile.ts";
import { AddRelease } from "./services/AddRelease.ts";
import { DisableRelease } from "./services/DisableRelease.ts";
import { EnableRelease } from "./services/EnableRelease.ts";
import { GetAllDaemonReleases } from "./services/GetAllDaemonReleases.ts";
import { GetOrSetDaemonInstanceId } from "./services/GetOrSetDaemonInstanceId.ts";
import { RegenerateMissionScriptingFiles } from "./services/RegenerateMissionScriptingFiles.ts";
import { RemoveRelease } from "./services/RemoveRelease.ts";

const logger = getLogger("Application");

export class Application extends Hono {
	public readonly enableRelease: EnableRelease;
	public readonly disableRelease: DisableRelease;
	public readonly removeRelease: RemoveRelease;

	constructor() {
		super();

		logger.debug("Setting up database connection");
		const db = Database(applicationConfig.database);

		logger.debug("Database connection established");

		const downloadQueue = new DownloadQueue({
			db,
			wgetExecutablePath: applicationConfig.binaries.wget,
		});

		const extractQueue = new ExtractQueue({
			db,
			downloadQueue,
			sevenzipExecutablePath: applicationConfig.binaries.sevenzip,
		});

		logger.debug("Services initialized");

		const writeFile = new _WriteFile();
		const ensureDir = new _EnsureDir();
		const removeDir = new _RemoveDir();
		const ensureSymlink = new _EnsureSymlink();

		const getReleaseAssetsForReleaseId = new DrizzleGetReleaseAssetsForReleaseId({ db });
		const saveModAndReleaseData = new DrizzleSaveModAndRelease({ db });
		const getSymbolicLinksForReleaseId = new DrizzleGetSymbolicLinksForReleaseId({ db });
		const setInstalledPathForLinkId = new DrizzleSetInstalledPathForLinkId({ db });
		const getMissionScriptsByRunOn = new DrizzleGetMissionScriptsByRunOn({ db });
		const deleteModAndReleaseForReleaseId = new DrizzleDeleteModAndReleaseForReleaseId({ db });
		const saveDaemonInstanceId = new DrizzleSaveDaemonInstanceId({
			db,
			daemonInstanceIdKey: applicationConfig.app.daemonInstanceIdKey,
		});
		const getDaemonInstanceId = new DrizzleGetDaemonInstanceId({
			db,
			daemonInstanceIdKey: applicationConfig.app.daemonInstanceIdKey,
		});
		const getAllReleases = new DrizzleGetAllReleases({ db });
		const getDownloadJobsForReleaseAssetId = new DrizzleGetDownloadJobsForReleaseAssetId({ db });
		const getExtractJobsForReleaseAssetId = new DrizzleGetExtractJobsForReleaseAssetId({ db });
		const getMissionScriptsForReleaseId = new DrizzleGetMissionScriptsForReleaseId({ db });

		const getOrSetDaemonInstanceId = new GetOrSetDaemonInstanceId({
			saveDaemonInstanceId,
			getDaemonInstanceId,
			generateUuid: crypto.randomUUID,
		});

		const resolveReleasePath = new _ResolveReleasePath({ dropzoneModsFolder: applicationConfig.app.mods_dir });
		const resolveSymbolicLinkPath = new _ResolveSymbolicLinkPath({
			dcsPaths: {
				[SymbolicLinkDestRoot.DCS_INSTALL_DIR]: applicationConfig.dcs.dcs_install_dir,
				[SymbolicLinkDestRoot.DCS_WORKING_DIR]: applicationConfig.dcs.dcs_working_dir,
			},
		});

		const regenerateMissionScriptingFiles = new RegenerateMissionScriptingFiles({
			resolveReleasePath,
			getMissionScriptsByRunOn,
			resolveSymbolicLinkPath,
			writeFile,
		});

		const addRelease = new AddRelease({
			saveModAndReleaseData,
			getReleaseAssetsForReleaseId,
			extractQueue,
			downloadQueue,
			resolveReleasePath,
			ensureDir,
		});

		const getAllDaemonReleases = new GetAllDaemonReleases({
			getReleaseAssetsForReleaseId,
			getAllReleases,
			getMissionScriptsForReleaseId,
			getSymbolicLinksForReleaseId,
			getDownloadJobsForReleaseAssetId,
			getExtractJobsForReleaseAssetId,
		});

		this.disableRelease = new DisableRelease({
			getSymbolicLinksForReleaseId,
			setInstalledPathForLinkId,
			regenerateMissionScriptingFiles,
			removeDir,
		});

		this.enableRelease = new EnableRelease({
			regenerateMissionScriptingFiles,
			setInstalledPathForLinkId,
			getSymbolicLinksForReleaseId,
			resolveReleasePath,
			resolveSymbolicLinkPath,
			ensureSymlink,
		});

		this.removeRelease = new RemoveRelease({
			resolveReleasePath,
			disableRelease: this.disableRelease,
			extractQueue,
			downloadQueue,
			deleteModAndReleaseForReleaseId,
			removeDir,
		});

		AllDaemonReleases.$.next(getAllDaemonReleases.execute());
		setInterval(() => AllDaemonReleases.$.next(getAllDaemonReleases.execute()), 1000);

		this.use("/*", cors());

		this.use(requestId());

		this.use("*", requestResponseLogger);

		this.get(
			"/v3/api-docs",
			openAPIRouteHandler(this, {
				documentation: {
					info: {
						title: "DCS Dropzone Daemon API",
						version: "1.0.0",
						description: "API documentation for the DCS Dropzone Daemon.",
					},
				},
			}),
		);

		this.get("/api", Scalar({ url: "/v3/api-docs" }));

		this.route("/", health({ daemonInstanceId: getOrSetDaemonInstanceId.execute() }));
		this.route("/", downloads({ addRelease, removeRelease: this.removeRelease, getAllDaemonReleases }));
		this.route("/", toggle({ enableRelease: this.enableRelease, disableRelease: this.disableRelease }));

		this.onError(jsonErrorTransformer);
	}
}
