import { describeJsonRoute } from "@packages/hono/describeJsonRoute";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { ErrorData } from "../application/schemas/ErrorData.ts";
import ApplicationFactory from "../hono/ApplicationFactory.ts";

export const GetTags = ApplicationFactory.createHandlers(
	describeJsonRoute({
		operationId: "getTags",
		summary: "Get Tags",
		description: "Retrieves a list of all tags.",
		tags: ["Tags"],
		responses: {
			[StatusCodes.OK]: z.string().array(),
			[StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData,
		},
	}),
	async (c) => {
		const result = await c.var.app.publicMods.getAllTags();
		return c.json(z.string().array().parse(result), StatusCodes.OK);
	},
);
