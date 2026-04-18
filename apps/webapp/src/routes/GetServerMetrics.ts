import { describeJsonRoute } from "@packages/hono/describeJsonRoute";
import { StatusCodes } from "http-status-codes";
import { ErrorData } from "../application/schemas/ErrorData.ts";
import { ServerMetricsData } from "../application/schemas/ServerMetricsData.ts";
import ApplicationFactory from "../hono/ApplicationFactory.ts";

export const GetServerMetrics = ApplicationFactory.createHandlers(
	describeJsonRoute({
		operationId: "getServerMetrics",
		summary: "Get Server Metrics",
		description: "Retrieves the build metrics.",
		tags: ["Dashboard"],
		responses: {
			[StatusCodes.OK]: ServerMetricsData,
			[StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData,
		},
	}),
	async (c) => {
		const metrics = await c.var.app.publicMods.getServerMetrics();
		return c.json(metrics, StatusCodes.OK);
	},
);
