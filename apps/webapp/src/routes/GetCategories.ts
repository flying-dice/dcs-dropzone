import { describeJsonRoute } from "@packages/hono/describeJsonRoute";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { ErrorData } from "../application/schemas/ErrorData.ts";
import ApplicationFactory from "../hono/ApplicationFactory.ts";

export const GetCategories = ApplicationFactory.createHandlers(
	describeJsonRoute({
		operationId: "getCategories",
		summary: "Get Categories",
		description: "Retrieves a list of all mod categories along with the count of published mods in each category.",
		tags: ["Categories"],
		responses: {
			[StatusCodes.OK]: z.record(z.string(), z.number()),
			[StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData,
		},
	}),
	async (c) => {
		const result = await c.var.app.publicMods.getCategoryCounts();
		return c.json(result, StatusCodes.OK);
	},
);
