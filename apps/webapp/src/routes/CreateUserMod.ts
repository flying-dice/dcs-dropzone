import { describeJsonRoute } from "@packages/hono/describeJsonRoute";
import { getLoggingHook } from "@packages/hono/getLoggingHook";
import { validator } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { getLogger } from "log4js";
import { ErrorData } from "../application/schemas/ErrorData.ts";
import { ModCreateData } from "../application/schemas/ModCreateData.ts";
import { ModData } from "../application/schemas/ModData.ts";
import ApplicationFactory from "../hono/ApplicationFactory.ts";
import { cookieAuth } from "../hono/middleware/cookieAuth.ts";

const logger = getLogger("CreateUserMod");
const loggingHook = getLoggingHook(logger);

export const CreateUserMod = ApplicationFactory.createHandlers(
	describeJsonRoute({
		operationId: "createUserMod",
		summary: "Create user mod",
		description: "Creates a new mod owned by the authenticated user.",
		tags: ["User Mods"],
		security: [{ cookieAuth: [] }],
		responses: {
			[StatusCodes.UNAUTHORIZED]: ErrorData,
			[StatusCodes.CREATED]: ModData,
			[StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData,
		},
	}),
	cookieAuth(),
	validator("json", ModCreateData, loggingHook),
	async (c) => {
		const createData = c.req.valid("json");
		const user = c.var.getUser();

		logger.debug(`User '${user.id}' is creating a new mod '${createData.name}'`);
		const result = await c.var.app.userMods.createMod(user, createData);

		return c.json(result, StatusCodes.CREATED);
	},
);
