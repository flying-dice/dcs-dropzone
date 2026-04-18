import { getLoggingHook } from "@packages/hono/getLoggingHook";
import { describeRoute, resolver, validator } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { getLogger } from "log4js";
import { z } from "zod";
import ApplicationFactory from "../hono/ApplicationFactory.ts";

const logger = getLogger("RemoveReleaseFromDaemon");
const loggingHook = getLoggingHook(logger);

export const RemoveReleaseFromDaemon = ApplicationFactory.createHandlers(
	describeRoute({
		operationId: "removeReleaseFromDaemon",
		tags: ["Downloads"],
		responses: {
			[StatusCodes.OK]: {
				description: "OK",
				content: { "application/json": { schema: resolver(z.null()) } },
			},
		},
	}),
	validator(
		"param",
		z.object({
			releaseId: z.string(),
		}),
		loggingHook,
	),
	(c) => {
		const { releaseId } = c.req.valid("param");
		logger.info("Removing release %s from daemon", releaseId);

		c.var.app.removeRelease(releaseId);

		logger.info("Release %s removed successfully", releaseId);
		return c.json(null, StatusCodes.OK);
	},
);
