import { describeRoute, resolver } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { getLogger } from "log4js";
import { appConfig } from "../config";
import { UiAppConfig } from "../config/schemas.ts";
import ApplicationFactory from "../hono/ApplicationFactory.ts";

const logger = getLogger("GetConfig");

const uiAppConfig = UiAppConfig.parse(appConfig);

export const GetConfig = ApplicationFactory.createHandlers(
	describeRoute({
		operationId: "getConfig",
		summary: "Get Config",
		description: "Retrieves the current application configuration.",
		tags: ["Config"],
		responses: {
			[StatusCodes.OK]: {
				description: "OK",
				content: { "application/json": { schema: resolver(UiAppConfig) } },
			},
		},
	}),
	async (c) => {
		logger.info("Retrieving application config");
		return c.json(uiAppConfig);
	},
);
