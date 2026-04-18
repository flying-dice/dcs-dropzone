import { describeJsonRoute } from "@packages/hono/describeJsonRoute";
import { getLoggingHook } from "@packages/hono/getLoggingHook";
import { zParse } from "@packages/zod/zParse";
import { validator } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { getLogger } from "log4js";
import { z } from "zod";
import { ErrorData } from "../application/schemas/ErrorData.ts";
import { ModReleaseData } from "../application/schemas/ModReleaseData.ts";
import { TypedErrorData } from "../application/schemas/TypedErrorData.ts";
import ApplicationFactory from "../hono/ApplicationFactory.ts";

const logger = getLogger("GetLatestModReleaseById");
const loggingHook = getLoggingHook(logger);

const LatestModReleaseErrors = z.enum(["ModNotFoundError", "ReleaseNotFoundError"]);

export const GetLatestModReleaseById = ApplicationFactory.createHandlers(
	describeJsonRoute({
		operationId: "getLatestModReleaseById",
		summary: "Get latest mod release by ID",
		description: "Retrieves the latest public release for a mod by its ID.",
		tags: ["Mod Releases"],
		responses: {
			[StatusCodes.OK]: ModReleaseData,
			[StatusCodes.NOT_FOUND]: TypedErrorData(LatestModReleaseErrors),
			[StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData,
		},
	}),
	validator(
		"param",
		z.object({
			id: z.string(),
		}),
		loggingHook,
	),
	async (c) => {
		const { id } = c.req.valid("param");

		logger.debug(`Fetching latest release for mod '${id}'`);

		const [data, releaseError] = await c.var.app.publicMods.findLatestPublicModRelease(id);

		if (releaseError) {
			return c.json(
				zParse(
					{ code: StatusCodes.NOT_FOUND, error: releaseError.constructor.name },
					TypedErrorData(LatestModReleaseErrors),
				),
				StatusCodes.NOT_FOUND,
			);
		}

		return c.json(data, StatusCodes.OK);
	},
);
