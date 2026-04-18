import { describeJsonRoute } from "@packages/hono/describeJsonRoute";
import { StatusCodes } from "http-status-codes";
import { ErrorData } from "../application/schemas/ErrorData.ts";
import { ModSummaryData } from "../application/schemas/ModSummaryData.ts";
import ApplicationFactory from "../hono/ApplicationFactory.ts";

export const GetPopularMods = ApplicationFactory.createHandlers(
	describeJsonRoute({
		operationId: "getPopularMods",
		summary: "Get Popular mods",
		description: "Retrieves a set of popular mods.",
		tags: ["Dashboard"],
		responses: {
			[StatusCodes.OK]: ModSummaryData.array(),
			[StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData,
		},
	}),
	async (c) => {
		const result = await c.var.app.publicMods.getAllPopularMods();
		return c.json(result, StatusCodes.OK);
	},
);
