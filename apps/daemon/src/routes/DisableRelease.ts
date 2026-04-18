import { getLoggingHook } from "@packages/hono/getLoggingHook";
import { ErrorData, OkData } from "@packages/hono/schemas";
import { zParse } from "@packages/zod/zParse";
import { describeRoute, resolver, validator } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { getLogger } from "log4js";
import { z } from "zod";
import { DisableReleaseError } from "../application/schemas/ToggleErrors.ts";
import ApplicationFactory from "../hono/ApplicationFactory.ts";

const logger = getLogger("DisableRelease");
const loggingHook = getLoggingHook(logger);

export const DisableRelease = ApplicationFactory.createHandlers(
	describeRoute({
		operationId: "disableRelease",
		tags: ["Toggle"],
		summary: "Disable a release by removing its symbolic links",
		responses: {
			[StatusCodes.OK]: {
				description: "Release disabled successfully",
				content: { "application/json": { schema: resolver(OkData) } },
			},
			[StatusCodes.UNPROCESSABLE_ENTITY]: {
				description: "Failed to disable release due to unprocessable entity error",
				content: { "application/json": { schema: resolver(DisableReleaseError) } },
			},
			[StatusCodes.INTERNAL_SERVER_ERROR]: {
				description: "Failed to disable release due to internal server error",
				content: { "application/json": { schema: resolver(ErrorData) } },
			},
		},
	}),
	validator("param", z.object({ releaseId: z.string() }), loggingHook),
	async (c) => {
		const { releaseId } = c.req.valid("param");
		logger.info("Disabling release %s", releaseId);
		const [, disableErr] = c.var.app.disableRelease(releaseId);
		if (disableErr) {
			logger.error("Failed to disable release %s: %s", releaseId, disableErr.reason);
			return c.json(disableErr, StatusCodes.UNPROCESSABLE_ENTITY);
		}

		logger.info("Release %s disabled successfully", releaseId);
		return c.json(zParse({ ok: true }, OkData), StatusCodes.OK);
	},
);
