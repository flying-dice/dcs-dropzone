import { getLoggingHook } from "@packages/hono/getLoggingHook";
import { describeRoute, resolver, validator } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { getLogger } from "log4js";
import { z } from "zod";
import ApplicationFactory from "../hono/ApplicationFactory.ts";

const logger = getLogger("PutSettings");
const loggingHook = getLoggingHook(logger);

const SettingsBody = z.object({
	dcsWorkingDir: z.string().optional(),
	dcsInstallDir: z.string().optional(),
	dropzoneModsDir: z.string().optional(),
});

const SettingsResponse = z.object({
	dcsWorkingDir: z.string().optional(),
	dcsInstallDir: z.string().optional(),
	dropzoneModsDir: z.string().optional(),
});

export const PutSettings = ApplicationFactory.createHandlers(
	describeRoute({
		operationId: "putSettings",
		summary: "Update Settings",
		description: "Updates the daemon path settings. Only provided fields are updated.",
		tags: ["Settings"],
		responses: {
			[StatusCodes.OK]: {
				description: "OK",
				content: { "application/json": { schema: resolver(SettingsResponse) } },
			},
		},
	}),
	validator("json", SettingsBody, loggingHook),
	(c) => {
		const body = c.req.valid("json");
		logger.info("Updating daemon settings");
		const updated = c.var.app.settings.setAll(body);
		logger.info("Settings updated successfully");
		return c.json(updated, StatusCodes.OK);
	},
);
