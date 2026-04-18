import { describeJsonRoute } from "@packages/hono/describeJsonRoute";
import { getLoggingHook } from "@packages/hono/getLoggingHook";
import { zParse } from "@packages/zod/zParse";
import { validator } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { getLogger } from "log4js";
import { z } from "zod";
import { ErrorData } from "../application/schemas/ErrorData.ts";
import { OkData } from "../application/schemas/OkData.ts";
import ApplicationFactory from "../hono/ApplicationFactory.ts";
import { cookieAuth } from "../hono/middleware/cookieAuth.ts";

const logger = getLogger("DeleteUserMod");
const loggingHook = getLoggingHook(logger);

export const DeleteUserMod = ApplicationFactory.createHandlers(
	describeJsonRoute({
		operationId: "deleteUserMod",
		summary: "Delete user mod",
		description: "Deletes an existing mod owned by the authenticated user.",
		tags: ["User Mods"],
		security: [{ cookieAuth: [] }],
		responses: {
			[StatusCodes.OK]: OkData,
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

		const [, deleteError] = await c.var.app.userMods.deleteMod(user, id);

		if (deleteError) {
			return c.json(
				zParse({ code: StatusCodes.NOT_FOUND, error: deleteError.constructor.name }, ErrorData),
				StatusCodes.NOT_FOUND,
			);
		}

		return c.json(OkData.parse({ ok: true }), StatusCodes.OK);
	},
);
