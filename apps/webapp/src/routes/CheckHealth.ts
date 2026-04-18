import { describeJsonRoute } from "@packages/hono/describeJsonRoute";
import { zParse } from "@packages/zod/zParse";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { ErrorData } from "../application/schemas/ErrorData.ts";
import Database from "../database";
import ApplicationFactory from "../hono/ApplicationFactory.ts";

export const CheckHealth = ApplicationFactory.createHandlers(
	describeJsonRoute({
		operationId: "checkHealth",
		summary: "Health Check",
		description: "Checks the health status of the applications.",
		tags: ["Health"],
		responses: {
			[StatusCodes.OK]: z.object({
				status: z.literal("ok"),
				mongoStatus: z.boolean(),
			}),
			[StatusCodes.SERVICE_UNAVAILABLE]: ErrorData,
		},
	}),
	async (c) => {
		try {
			await Database.ping();
			return c.json(
				{
					status: "ok" as const,
					mongoStatus: await Database.ping(),
				},
				StatusCodes.OK,
			);
		} catch (error) {
			return c.json(
				zParse({ error: String(error), code: StatusCodes.SERVICE_UNAVAILABLE }, ErrorData),
				StatusCodes.SERVICE_UNAVAILABLE,
			);
		}
	},
);
