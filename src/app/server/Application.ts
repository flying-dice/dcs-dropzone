import { getLogger } from "log4js";
import { server } from "./Server.ts";

const logger = getLogger("Application");

logger.debug("Application initialized");

export default {
	server,
};
