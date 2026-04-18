import { getLoggingHook } from "@packages/hono/getLoggingHook";
import { ErrorData, OkData } from "@packages/hono/schemas";
import { zParse } from "@packages/zod/zParse";
import { describeRoute, resolver, validator } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { getLogger } from "log4js";
import { z } from "zod";
import { EnableReleaseError } from "../application/schemas/ToggleErrors.ts";
import ApplicationFactory from "../hono/ApplicationFactory.ts";

const logger = getLogger("EnableRelease");
const loggingHook = getLoggingHook(logger);

export const EnableRelease = ApplicationFactory.createHandlers(
	describeRoute({
		operationId: "enableRelease",
		tags: ["Toggle"],
		summary: "Enable a release by creating its symbolic links",
		responses: {
			[StatusCodes.OK]: {
				description: "Release enabled successfully",
				content: { "application/json": { schema: resolver(OkData) } },
			},
			[StatusCodes.UNPROCESSABLE_ENTITY]: {
				description: "Failed to enable release due to unprocessable entity error",
				content: { "application/json": { schema: resolver(EnableReleaseError) } },
			},
			[StatusCodes.INTERNAL_SERVER_ERROR]: {
				description: "Failed to enable release due to internal server error",
				content: { "application/json": { schema: resolver(ErrorData) } },
			},
		},
	}),
	validator("param", z.object({ releaseId: z.string() }), loggingHook),
	async (c) => {
		const { releaseId } = c.req.valid("param");
		logger.info("Enabling release %s", releaseId);
		const [, enableErr] = await c.var.app.enableRelease(releaseId);
		if (enableErr) {
			logger.error("Failed to enable release %s: %s", releaseId, enableErr.reason);
			return c.json(enableErr, StatusCodes.UNPROCESSABLE_ENTITY);
		}

		logger.info("Release %s enabled successfully", releaseId);
		return c.json(zParse({ ok: true }, OkData), StatusCodes.OK);
	},
);
