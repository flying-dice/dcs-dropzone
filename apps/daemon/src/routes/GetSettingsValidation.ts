import { describeRoute, resolver } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { getLogger } from "log4js";
import { z } from "zod";
import ApplicationFactory from "../hono/ApplicationFactory.ts";

const logger = getLogger("GetSettingsValidation");

const SettingsValidationEntry = z.object({
	exists: z.boolean(),
	resolvedPath: z.string().optional(),
	error: z.string().optional(),
});

const SettingsValidationResponse = z.object({
	valid: z.boolean(),
	dcsWorkingDir: SettingsValidationEntry,
	dcsInstallDir: SettingsValidationEntry,
	dropzoneModsDir: SettingsValidationEntry,
});

export const GetSettingsValidation = ApplicationFactory.createHandlers(
	describeRoute({
		operationId: "getSettingsValidation",
		summary: "Validate Settings",
		description:
			"Validates the current daemon path settings by checking if all directories are configured and exist on disk.",
		tags: ["Settings"],
		responses: {
			[StatusCodes.OK]: {
				description: "OK",
				content: { "application/json": { schema: resolver(SettingsValidationResponse) } },
			},
		},
	}),
	(c) => {
		logger.info("Validating daemon settings");
		const result = c.var.app.settings.validate();
		logger.info("Settings validation result: valid=%s", result.valid);
		return c.json(result, StatusCodes.OK);
	},
);
