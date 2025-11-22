import Logger from "../app/server/Logger.ts";
import applicationConfig from "./ApplicationConfig.ts";
import Server from "./Server.ts";
import { ReleaseAssetService } from "./services/ReleaseAssetService.ts";
import { SevenzipService } from "./services/SevenzipService.ts";
import { SubscriptionService } from "./services/SubscriptionService.ts";
import { WgetService } from "./services/WgetService.ts";

const logger = Logger.getLogger("Application");

logger.debug("Initializing services");
const wgetService = new WgetService({
	exePath: applicationConfig.binaries.wget,
});
const sevenzipService = new SevenzipService({
	exePath: applicationConfig.binaries.sevenzip,
});
const subscriptionService = new SubscriptionService();
logger.debug("Services initialized");

function getReleaseAssetService(releaseId: string): ReleaseAssetService {
	logger.debug("Creating ReleaseAssetService instance");
	return new ReleaseAssetService(releaseId, wgetService, sevenzipService);
}

export default {
	server: Server,
	subscriptionService,
	getReleaseAssetService,
	wgetService,
	sevenzipService,
};
