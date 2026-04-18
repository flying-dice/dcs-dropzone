import { describeJsonRoute } from "@packages/hono/describeJsonRoute";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { ErrorData } from "../application/schemas/ErrorData.ts";
import { ModSummaryData } from "../application/schemas/ModSummaryData.ts";
import { UserModsMetaData } from "../application/schemas/UserModsMetaData.ts";
import ApplicationFactory from "../hono/ApplicationFactory.ts";
import { cookieAuth } from "../hono/middleware/cookieAuth.ts";

export const GetUserMods = ApplicationFactory.createHandlers(
	describeJsonRoute({
		operationId: "getUserMods",
		summary: "Get user mods",
		description: "Retrieves a list of all mods owned by the authenticated user.",
		tags: ["User Mods"],
		security: [{ cookieAuth: [] }],
		responses: {
			[StatusCodes.OK]: z.object({
				data: ModSummaryData.array(),
				meta: UserModsMetaData,
			}),
			[StatusCodes.UNAUTHORIZED]: ErrorData,
			[StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData,
		},
	}),
	cookieAuth(),
	async (c) => {
		const user = c.var.getUser();

		const mods = await c.var.app.userMods.findAllMods(user);

		return c.json(mods, StatusCodes.OK);
	},
);
