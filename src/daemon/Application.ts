import Logger from "../app/server/Logger.ts";
import {
	SEVENZIP_EXECUTABLE_PATH,
	WGET_EXECUTABLE_PATH,
} from "./ApplicationConfig.ts";
import Server from "./Server.ts";
import { ReleaseDownloadService } from "./services/ReleaseDownloadService.ts";
import { SevenzipService } from "./services/SevenzipService.ts";
import { SubscriptionService } from "./services/SubscriptionService.ts";
import { WgetService } from "./services/WgetService.ts";

const logger = Logger.getLogger("Application");

logger.debug("Initializing services");
const wgetService = new WgetService({ exePath: WGET_EXECUTABLE_PATH });
const sevenzipService = new SevenzipService({
	exePath: SEVENZIP_EXECUTABLE_PATH,
});
const releaseDownloadService = new ReleaseDownloadService({
	wgetService,
	sevenzipService,
});
const subscriptionService = new SubscriptionService();
logger.debug("Services initialized");

export default {
	server: Server,
	subscriptionService,
	releaseDownloadService,
	wgetService,
	sevenzipService,
};
