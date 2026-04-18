import { describeRoute, resolver } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { getLogger } from "log4js";
import { ModAndReleaseData } from "../application/schemas/ModAndReleaseData.ts";
import ApplicationFactory from "../hono/ApplicationFactory.ts";

const logger = getLogger("GetAllDaemonReleases");

export const GetAllDaemonReleases = ApplicationFactory.createHandlers(
	describeRoute({
		operationId: "getAllDaemonReleases",
		tags: ["Downloads"],
		responses: {
			[StatusCodes.OK]: {
				description: "OK",
				content: { "application/json": { schema: resolver(ModAndReleaseData.array()) } },
			},
		},
	}),
	(c) => {
		logger.info("Retrieving all daemon releases");
		const subscriptions = c.var.app.getAllReleasesWithStatus();
		logger.info("Retrieved %d releases", subscriptions.length);
		return c.json(subscriptions, StatusCodes.OK);
	},
);
