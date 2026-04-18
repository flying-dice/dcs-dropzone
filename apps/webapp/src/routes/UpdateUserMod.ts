import { describeJsonRoute } from "@packages/hono/describeJsonRoute";
import { getLoggingHook } from "@packages/hono/getLoggingHook";
import { zParse } from "@packages/zod/zParse";
import { validator } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { getLogger } from "log4js";
import { z } from "zod";
import { ErrorData } from "../application/schemas/ErrorData.ts";
import { ModUpdateData } from "../application/schemas/ModUpdateData.ts";
import { OkData } from "../application/schemas/OkData.ts";
import ApplicationFactory from "../hono/ApplicationFactory.ts";
import { cookieAuth } from "../hono/middleware/cookieAuth.ts";

const logger = getLogger("UpdateUserMod");
const loggingHook = getLoggingHook(logger);

export const UpdateUserMod = ApplicationFactory.createHandlers(
	describeJsonRoute({
		operationId: "updateUserMod",
		summary: "Update user mod",
		description: "Updates an existing mod owned by the authenticated user.",
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
	validator("json", ModUpdateData.omit({ id: true }), loggingHook),
	async (c) => {
		const { id } = c.req.valid("param");
		const updateData = c.req.valid("json");
		const user = c.var.getUser();

		const [, updateError] = await c.var.app.userMods.updateMod(user, { ...updateData, id });

		if (updateError) {
			return c.json(
				zParse({ code: StatusCodes.NOT_FOUND, error: updateError.constructor.name }, ErrorData),
				StatusCodes.NOT_FOUND,
			);
		}

		return c.json(OkData.parse({ ok: true }), StatusCodes.OK);
	},
);
