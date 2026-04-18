import { describeRoute, resolver } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { getLogger } from "log4js";
import { z } from "zod";
import ApplicationFactory from "../hono/ApplicationFactory.ts";

const logger = getLogger("GetSettings");

const SettingsResponse = z.object({
	dcsWorkingDir: z.string().optional(),
	dcsInstallDir: z.string().optional(),
	dropzoneModsDir: z.string().optional(),
});

export const GetSettings = ApplicationFactory.createHandlers(
	describeRoute({
		operationId: "getSettings",
		summary: "Get Settings",
		description: "Retrieves the current daemon path settings.",
		tags: ["Settings"],
		responses: {
			[StatusCodes.OK]: {
				description: "OK",
				content: { "application/json": { schema: resolver(SettingsResponse) } },
			},
		},
	}),
	(c) => {
		logger.info("Retrieving daemon settings");
		return c.json(c.var.app.settings.getAll(), StatusCodes.OK);
	},
);
