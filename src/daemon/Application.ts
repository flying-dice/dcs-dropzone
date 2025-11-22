import Logger from "../app/server/Logger.ts";
import Server from "./Server.ts";
import { SubscriptionService } from "./services/SubscriptionService.ts";

const logger = Logger.getLogger("Application");

logger.debug("Initializing services");
const subscriptionService = new SubscriptionService();
logger.debug("Services initialized");

export default {
	server: Server,
	subscriptionService,
};
