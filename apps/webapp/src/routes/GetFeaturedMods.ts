import { describeJsonRoute } from "@packages/hono/describeJsonRoute";
import { StatusCodes } from "http-status-codes";
import { ErrorData } from "../application/schemas/ErrorData.ts";
import { ModSummaryData } from "../application/schemas/ModSummaryData.ts";
import ApplicationFactory from "../hono/ApplicationFactory.ts";

export const GetFeaturedMods = ApplicationFactory.createHandlers(
	describeJsonRoute({
		operationId: "getFeaturedMods",
		summary: "Get Featured mods",
		description: "Retrieves a set of featured mods.",
		tags: ["Dashboard"],
		responses: {
			[StatusCodes.OK]: ModSummaryData.array(),
			[StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData,
		},
	}),
	async (c) => {
		const result = await c.var.app.publicMods.getAllFeaturedMods();
		return c.json(result, StatusCodes.OK);
	},
);
