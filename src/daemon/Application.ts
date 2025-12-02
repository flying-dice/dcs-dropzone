import { getLogger } from "log4js";
import { SymbolicLinkDestRoot } from "../common/data.ts";
import applicationConfig from "./ApplicationConfig.ts";
import { db } from "./database";
import { DownloadQueue } from "./queues/DownloadQueue.ts";
import { ExtractQueue } from "./queues/ExtractQueue.ts";
import type { DownloadsRepository } from "./repositories/DownloadsRepository.ts";
import { DrizzleSqliteModReleaseSymbolicLinkRepository } from "./repositories/impl/DrizzleSqliteModReleaseSymbolicLinkRepository.ts";
import { DrizzleSqliteReleaseAssetRepository } from "./repositories/impl/DrizzleSqliteReleaseAssetRepository.ts";
import { DrizzleSqliteSubscriptionRepository } from "./repositories/impl/DrizzleSqliteSubscriptionRepository.ts";
import type { ReleaseAssetRepository } from "./repositories/ReleaseAssetRepository.ts";
import { createServer } from "./Server.ts";
import { DownloadsService } from "./services/DownloadsService.ts";
import { PathService } from "./services/PathService.ts";
import { ReleaseAssetService } from "./services/ReleaseAssetService.ts";
import { ToggleService } from "./services/ToggleService.ts";

const logger = getLogger("Application");

const pathService = new PathService(
	{
		[SymbolicLinkDestRoot.DCS_INSTALL_DIR]:
			applicationConfig.dcs.dcs_install_dir,
		[SymbolicLinkDestRoot.DCS_WORKING_DIR]:
			applicationConfig.dcs.dcs_working_dir,
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
});

logger.debug("Initializing repositories");
const subscriptionRepository: DownloadsRepository =
	new DrizzleSqliteSubscriptionRepository(_db);
const releaseAssetRepository: ReleaseAssetRepository =
	new DrizzleSqliteReleaseAssetRepository(_db);

logger.debug("Initializing services");

function getReleaseAssetService(releaseId: string): ReleaseAssetService {
	logger.debug("Creating ReleaseAssetService instance");
	return new ReleaseAssetService(
		releaseId,
		releaseAssetRepository,
		downloadQueue,
		extractQueue,
	);
}

const linkRepo = new DrizzleSqliteModReleaseSymbolicLinkRepository(_db);
const toggleService = new ToggleService({
	linkRepo,
	pathService,
});

const downloadsService = new DownloadsService(
	subscriptionRepository,
	toggleService,
	getReleaseAssetService,
);

logger.debug("Services initialized");

const server = createServer({
	downloadsService,
	downloadQueue,
	extractQueue,
	toggleService,
});

export default {
	server,
	downloadsService,
	downloadQueue,
	extractQueue,
	toggleService,
};
