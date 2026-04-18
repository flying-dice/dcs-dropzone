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
import { cookieAuth } from "../hono/middleware/cookieAuth.ts";

const logger = getLogger("GetUserModReleases");
const loggingHook = getLoggingHook(logger);

export const GetUserModReleases = ApplicationFactory.createHandlers(
	describeJsonRoute({
		operationId: "getUserModReleases",
		summary: "Get user mod releases",
		description: "Retrieves all releases for a specific mod owned by the authenticated user.",
		tags: ["User Mod Releases"],
		security: [{ cookieAuth: [] }],
		responses: {
			[StatusCodes.OK]: z.object({
				data: ModReleaseData.array(),
			}),
			[StatusCodes.NOT_FOUND]: ErrorData,
			[StatusCodes.UNAUTHORIZED]: ErrorData,
			[StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData,
		},
	}),
	cookieAuth(),
	validator("param", z.object({ id: z.string() }), loggingHook),
	async (c) => {
		const { id } = c.req.valid("param");
		const user = c.var.getUser();

		logger.debug(`User '${user.id}' is requesting releases for mod '${id}'`);

		const [data, releasesError] = await c.var.app.userMods.findReleases(user, id);

		if (releasesError) {
			return c.json(
				zParse({ code: StatusCodes.NOT_FOUND, error: releasesError.constructor.name }, ErrorData),
				StatusCodes.NOT_FOUND,
			);
		}

		return c.json({ data }, StatusCodes.OK);
	},
);
