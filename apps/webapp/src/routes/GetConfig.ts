import { describeJsonRoute } from "@packages/hono/describeJsonRoute";
import { StatusCodes } from "http-status-codes";
import { appConfig, UiAppConfig } from "../config";
import ApplicationFactory from "../hono/ApplicationFactory.ts";

export const GetConfig = ApplicationFactory.createHandlers(
	describeJsonRoute({
		operationId: "getConfig",
		summary: "Get Config",
		description: "Retrieves the current application configuration.",
		tags: ["Config"],
		responses: {
			[StatusCodes.OK]: UiAppConfig,
		},
	}),
	async (c) => {
		return c.json(UiAppConfig.parse(appConfig));
	},
);
