import { getLoggingHook } from "@packages/hono/getLoggingHook";
import { ErrorData, OkData } from "@packages/hono/schemas";
import { zParse } from "@packages/zod/zParse";
import { describeRoute, resolver, validator } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { getLogger } from "log4js";
import { z } from "zod";
import { ToggleReleaseError } from "../application/schemas/ToggleErrors.ts";
import ApplicationFactory from "../hono/ApplicationFactory.ts";

const logger = getLogger("ToggleRelease");
const loggingHook = getLoggingHook(logger);

export const ToggleRelease = ApplicationFactory.createHandlers(
	describeRoute({
		operationId: "toggleRelease",
		tags: ["Toggle"],
		summary: "Toggle a release enabled state",
		description: "Enables the release if currently disabled, or disables it if currently enabled.",
		responses: {
			[StatusCodes.OK]: {
				description: "Release toggled successfully",
				content: { "application/json": { schema: resolver(OkData) } },
			},
			[StatusCodes.UNPROCESSABLE_ENTITY]: {
				description: "Failed to toggle release due to unprocessable entity error",
				content: { "application/json": { schema: resolver(ToggleReleaseError) } },
			},
			[StatusCodes.INTERNAL_SERVER_ERROR]: {
				description: "Failed to toggle release due to internal server error",
				content: { "application/json": { schema: resolver(ErrorData) } },
			},
		},
	}),
	validator("param", z.object({ releaseId: z.string() }), loggingHook),
	async (c) => {
		const { releaseId } = c.req.valid("param");
		logger.info("Toggling release %s", releaseId);
		const [, toggleErr] = await c.var.app.toggleRelease(releaseId);
		if (toggleErr) {
			logger.error("Failed to toggle release %s: %s", releaseId, toggleErr.reason);
			return c.json(toggleErr, StatusCodes.UNPROCESSABLE_ENTITY);
		}

		logger.info("Release %s toggled successfully", releaseId);
		return c.json(zParse({ ok: true }, OkData), StatusCodes.OK);
	},
);
