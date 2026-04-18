import { describeJsonRoute } from "@packages/hono/describeJsonRoute";
import { getLoggingHook } from "@packages/hono/getLoggingHook";
import { zParse } from "@packages/zod/zParse";
import { validator } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { getLogger } from "log4js";
import { z } from "zod";
import { ErrorData } from "../application/schemas/ErrorData.ts";
import { ModData } from "../application/schemas/ModData.ts";
import ApplicationFactory from "../hono/ApplicationFactory.ts";
import { cookieAuth } from "../hono/middleware/cookieAuth.ts";

const logger = getLogger("GetUserModById");
const loggingHook = getLoggingHook(logger);

export const GetUserModById = ApplicationFactory.createHandlers(
	describeJsonRoute({
		operationId: "getUserModById",
		summary: "Get user mod by ID",
		description: "Retrieves a specific mod owned by the authenticated user by its ID.",
		tags: ["User Mods"],
		security: [{ cookieAuth: [] }],
		responses: {
			[StatusCodes.OK]: ModData,
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

		logger.debug(`User '${user.id}' is requesting mod '${id}'`);

		const [body, findError] = await c.var.app.userMods.findById(user, id);

		if (findError) {
			return c.json(
				zParse({ code: StatusCodes.NOT_FOUND, error: findError.constructor.name }, ErrorData),
				StatusCodes.NOT_FOUND,
			);
		}

		return c.json(body, StatusCodes.OK);
	},
);
