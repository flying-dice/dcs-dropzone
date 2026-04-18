import { describeJsonRoute } from "@packages/hono/describeJsonRoute";
import { getLoggingHook } from "@packages/hono/getLoggingHook";
import { zParse } from "@packages/zod/zParse";
import { validator } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { getLogger } from "log4js";
import { z } from "zod";
import { ErrorData } from "../application/schemas/ErrorData.ts";
import { ModReleaseCreateData } from "../application/schemas/ModReleaseCreateData.ts";
import { ModReleaseData } from "../application/schemas/ModReleaseData.ts";
import ApplicationFactory from "../hono/ApplicationFactory.ts";
import { cookieAuth } from "../hono/middleware/cookieAuth.ts";

const logger = getLogger("CreateUserModRelease");
const loggingHook = getLoggingHook(logger);

export const CreateUserModRelease = ApplicationFactory.createHandlers(
	describeJsonRoute({
		operationId: "createUserModRelease",
		summary: "Create user mod release",
		description: "Creates a new release for a mod owned by the authenticated user.",
		tags: ["User Mod Releases"],
		security: [{ cookieAuth: [] }],
		responses: {
			[StatusCodes.CREATED]: ModReleaseData,
			[StatusCodes.NOT_FOUND]: ErrorData,
			[StatusCodes.UNAUTHORIZED]: ErrorData,
			[StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData,
		},
	}),
	cookieAuth(),
	validator("param", z.object({ id: z.string() }), loggingHook),
	validator("json", ModReleaseCreateData.omit({ modId: true }), loggingHook),
	async (c) => {
		const { id } = c.req.valid("param");
		const createData = c.req.valid("json");
		const user = c.var.getUser();

		logger.debug(`User '${user.id}' is creating a new release for mod '${id}'`);

		const [body, createError] = await c.var.app.userMods.createRelease(user, { ...createData, modId: id });

		if (createError) {
			return c.json(
				zParse({ code: StatusCodes.NOT_FOUND, error: createError.constructor.name }, ErrorData),
				StatusCodes.NOT_FOUND,
			);
		}

		return c.json(body, StatusCodes.CREATED);
	},
);
