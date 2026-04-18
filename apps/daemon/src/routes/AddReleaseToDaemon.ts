import { getLoggingHook } from "@packages/hono/getLoggingHook";
import { describeRoute, resolver, validator } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { getLogger } from "log4js";
import { z } from "zod";
import { ModAndReleaseData } from "../application/schemas/ModAndReleaseData.ts";
import { DropzoneModsDirInvalidError, DropzoneModsDirNotConfiguredError } from "../application/schemas/ToggleErrors.ts";
import ApplicationFactory from "../hono/ApplicationFactory.ts";

const logger = getLogger("AddReleaseToDaemon");
const loggingHook = getLoggingHook(logger);

const AddReleaseError = z.discriminatedUnion("reason", [DropzoneModsDirNotConfiguredError, DropzoneModsDirInvalidError]);

export const AddReleaseToDaemon = ApplicationFactory.createHandlers(
	describeRoute({
		operationId: "addReleaseToDaemon",
		tags: ["Downloads"],
		responses: {
			[StatusCodes.OK]: {
				description: "OK",
				content: { "application/json": { schema: resolver(z.null()) } },
			},
			[StatusCodes.UNPROCESSABLE_ENTITY]: {
				description: "Unprocessable Entity",
				content: { "application/json": { schema: resolver(AddReleaseError) } },
			},
		},
	}),
	validator("json", ModAndReleaseData, loggingHook),

	(c) => {
		const modAndRelease = c.req.valid("json");
		logger.info("Adding release to daemon: %s", modAndRelease.releaseId ?? "unknown");

		const [, addErr] = c.var.app.addRelease(modAndRelease);
		if (addErr) {
			logger.error("Failed to add release: %s", addErr.reason);
			return c.json(addErr, StatusCodes.UNPROCESSABLE_ENTITY);
		}

		logger.info("Release added successfully");
		return c.json(null, StatusCodes.OK);
	},
);
