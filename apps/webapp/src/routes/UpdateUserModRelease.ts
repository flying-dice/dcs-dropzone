import { describeJsonRoute } from "@packages/hono/describeJsonRoute";
import { getLoggingHook } from "@packages/hono/getLoggingHook";
import { zParse } from "@packages/zod/zParse";
import { validator } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { getLogger } from "log4js";
import { z } from "zod";
import { ErrorData } from "../application/schemas/ErrorData.ts";
import { ModReleaseData } from "../application/schemas/ModReleaseData.ts";
import { OkData } from "../application/schemas/OkData.ts";
import ApplicationFactory from "../hono/ApplicationFactory.ts";
import { cookieAuth } from "../hono/middleware/cookieAuth.ts";

const logger = getLogger("UpdateUserModRelease");
const loggingHook = getLoggingHook(logger);

export const UpdateUserModRelease = ApplicationFactory.createHandlers(
	describeJsonRoute({
		operationId: "updateUserModRelease",
		summary: "Update user mod release",
		description: "Updates fields of an existing release for a mod owned by the authenticated user.",
		tags: ["User Mod Releases"],
		security: [{ cookieAuth: [] }],
		responses: {
			[StatusCodes.OK]: OkData,
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
	validator("json", ModReleaseData.omit({ id: true, modId: true, versionHash: true }), loggingHook),
	async (c) => {
		const { id, releaseId } = c.req.valid("param");
		const updates = c.req.valid("json");
		const user = c.var.getUser();

		logger.debug(`User '${user.id}' is updating release '${releaseId}' for mod '${id}'`);

		const [, updateError] = await c.var.app.userMods.updateRelease(user, {
			id: releaseId,
			modId: id,
			...updates,
		});

		if (updateError) {
			return c.json(
				zParse({ code: StatusCodes.NOT_FOUND, error: updateError.constructor.name }, ErrorData),
				StatusCodes.NOT_FOUND,
			);
		}

		return c.json(
			OkData.parse({
				ok: true,
			}),
			StatusCodes.OK,
		);
	},
);
