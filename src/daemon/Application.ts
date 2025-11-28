import { getLogger } from "log4js";
import applicationConfig from "./ApplicationConfig.ts";
import { db } from "./database";
import { DownloadQueue } from "./queues/DownloadQueue.ts";
import { ExtractQueue } from "./queues/ExtractQueue.ts";
import { DrizzleSqliteSubscriptionRepository } from "./repositories/impl/DrizzleSqliteSubscriptionRepository.ts";
import type { SubscriptionRepository } from "./repositories/SubscriptionRepository.ts";
import Server from "./Server.ts";
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

logger.debug("Initializing services");
const subscriptionRepository: SubscriptionRepository =
	new DrizzleSqliteSubscriptionRepository(_db);
const subscriptionService = new SubscriptionService(
	subscriptionRepository,
	downloadQueue,
);

logger.debug("Services initialized");

function getReleaseAssetService(releaseId: string): ReleaseAssetService {
	logger.debug("Creating ReleaseAssetService instance");
	return new ReleaseAssetService(releaseId, _db, downloadQueue, extractQueue);
}

export default {
	server: Server,
	subscriptionService,
	getReleaseAssetService,
	downloadQueue,
	extractQueue,
};
