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

const logger = getLogger("GetUserModReleaseById");
const loggingHook = getLoggingHook(logger);

export const GetUserModReleaseById = ApplicationFactory.createHandlers(
	describeJsonRoute({
		operationId: "getUserModReleaseById",
		summary: "Get user mod release by ID",
		description: "Retrieves a specific release for a user-owned mod by its ID.",
		tags: ["User Mod Releases"],
		security: [{ cookieAuth: [] }],
		responses: {
			[StatusCodes.OK]: ModReleaseData,
			[StatusCodes.NOT_FOUND]: ErrorData,
			[StatusCodes.UNAUTHORIZED]: ErrorData,
			[StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData,
		},
	}),
	cookieAuth(),
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
		const user = c.var.getUser();

		logger.debug(`User '${user.id}' is requesting release '${releaseId}' for mod '${id}'`);

		const [body, findError] = await c.var.app.userMods.findReleaseById(user, id, releaseId);

		if (findError) {
			return c.json(
				zParse({ code: StatusCodes.NOT_FOUND, error: findError.constructor.name }, ErrorData),
				StatusCodes.NOT_FOUND,
			);
		}

		return c.json(body, StatusCodes.OK);
	},
);
