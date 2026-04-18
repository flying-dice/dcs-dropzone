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

const logger = getLogger("GetModReleases");
const loggingHook = getLoggingHook(logger);

export const GetModReleases = ApplicationFactory.createHandlers(
	describeJsonRoute({
		operationId: "getModReleases",
		summary: "Get mod releases",
		description: "Retrieves all public releases for a specific mod.",
		tags: ["Mod Releases"],
		responses: {
			[StatusCodes.OK]: z.object({
				data: z.array(ModReleaseData),
			}),
			[StatusCodes.NOT_FOUND]: ErrorData,
			[StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData,
		},
	}),
	validator("param", z.object({ id: z.string() }), loggingHook),
	async (c) => {
		const { id } = c.req.valid("param");

		logger.debug(`Fetching public releases for mod '${id}'`);

		const [data, releasesError] = await c.var.app.publicMods.findPublicModReleases(id);

		if (releasesError) {
			return c.json(
				zParse({ code: StatusCodes.NOT_FOUND, error: releasesError.constructor.name }, ErrorData),
				StatusCodes.NOT_FOUND,
			);
		}

		return c.json({ data }, StatusCodes.OK);
	},
);
