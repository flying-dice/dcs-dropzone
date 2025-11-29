import { getLogger } from "log4js";
import applicationConfig from "./ApplicationConfig.ts";
import { db } from "./database";
import { DownloadQueue } from "./queues/DownloadQueue.ts";
import { ExtractQueue } from "./queues/ExtractQueue.ts";
import { DrizzleSqliteReleaseAssetRepository } from "./repositories/impl/DrizzleSqliteReleaseAssetRepository.ts";
import { DrizzleSqliteSubscriptionRepository } from "./repositories/impl/DrizzleSqliteSubscriptionRepository.ts";
import type { ReleaseAssetRepository } from "./repositories/ReleaseAssetRepository.ts";
import type { SubscriptionRepository } from "./repositories/SubscriptionRepository.ts";
import { createServer } from "./Server.ts";
import { ReleaseAssetService } from "./services/ReleaseAssetService.ts";
import { SubscriptionService } from "./services/SubscriptionService.ts";

const logger = getLogger("Application");

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
const subscriptionRepository: SubscriptionRepository =
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

const subscriptionService = new SubscriptionService(
	subscriptionRepository,
	downloadQueue,
	getReleaseAssetService,
);

logger.debug("Services initialized");

const server = createServer({
	subscriptionService,
	downloadQueue,
});

export default {
	server,
	subscriptionService,
	getReleaseAssetService,
	downloadQueue,
	extractQueue,
};
