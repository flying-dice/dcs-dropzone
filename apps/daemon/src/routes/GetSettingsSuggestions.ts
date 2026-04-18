import { describeRoute, resolver } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { getLogger } from "log4js";
import { z } from "zod";
import ApplicationFactory from "../hono/ApplicationFactory.ts";

const logger = getLogger("GetSettingsSuggestions");

const SettingsSuggestionsResponse = z.object({
	dcsWorkingDir: z.string().optional(),
	dcsInstallDir: z.string().optional(),
	dropzoneModsDir: z.string().optional(),
});

export const GetSettingsSuggestions = ApplicationFactory.createHandlers(
	describeRoute({
		operationId: "getSettingsSuggestions",
		summary: "Get Settings Suggestions",
		description: "Returns suggested default paths for settings based on the current system environment.",
		tags: ["Settings"],
		responses: {
			[StatusCodes.OK]: {
				description: "OK",
				content: { "application/json": { schema: resolver(SettingsSuggestionsResponse) } },
			},
		},
	}),
	(c) => {
		logger.info("Retrieving settings suggestions");

		return c.json(
			{
				dcsWorkingDir: "%USERPROFILE%\\Saved Games\\DCS",
				dcsInstallDir: "%PROGRAMFILES%\\Eagle Dynamics\\DCS World",
				dropzoneModsDir: "%LOCALAPPDATA%\\DCS Dropzone\\Mods",
			},
			StatusCodes.OK,
		);
	},
);
