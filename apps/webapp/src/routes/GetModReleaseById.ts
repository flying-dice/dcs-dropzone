import { describeJsonRoute } from "@packages/hono/describeJsonRoute";
import { getLoggingHook } from "@packages/hono/getLoggingHook";
import { zParse } from "@packages/zod/zParse";
import { validator } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { getLogger } from "log4js";
import { z } from "zod";
import { ErrorData } from "../application/schemas/ErrorData.ts";
import { ModReleaseData } from "../application/schemas/ModReleaseData.ts";
import ApplicationFactory from "../hono/ApplicationFactory.ts";

const logger = getLogger("GetModReleaseById");
const loggingHook = getLoggingHook(logger);

export const GetModReleaseById = ApplicationFactory.createHandlers(
	describeJsonRoute({
		operationId: "getModReleaseById",
		summary: "Get mod release by ID",
		description: "Retrieves a specific public release for a mod by its ID.",
		tags: ["Mod Releases"],
		responses: {
			[StatusCodes.OK]: ModReleaseData,
			[StatusCodes.NOT_FOUND]: ErrorData,
			[StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData,
		},
	}),
	validator(
		"param",
		z.object({
			id: z.string(),
			releaseId: z.string(),
		}),
		loggingHook,
	),
	async (c) => {
		const { id, releaseId } = c.req.valid("param");

		logger.debug(`Fetching public release '${releaseId}' for mod '${id}'`);

		const [data, releaseError] = await c.var.app.publicMods.findPublicModReleaseById(id, releaseId);

		if (releaseError) {
			return c.json(
				zParse({ code: StatusCodes.NOT_FOUND, error: releaseError.constructor.name }, ErrorData),
				StatusCodes.NOT_FOUND,
			);
		}

		return c.json(data, StatusCodes.OK);
	},
);
