import { describeJsonRoute } from "@packages/hono/describeJsonRoute";
import { Hono } from "hono";
import { StatusCodes } from "http-status-codes";
import getAllFeaturedMods from "../queries/GetAllFeaturedMods.ts";
import getAllPopularMods from "../queries/GetAllPopularMods.ts";
import getServerMetricsData from "../queries/GetServerMetricsData.ts";
import { ErrorData } from "../schemas/ErrorData.ts";
import { ModSummaryData } from "../schemas/ModSummaryData.ts";
import { ServerMetricsData } from "../schemas/ServerMetricsData.ts";

const router = new Hono();

router.get(
	"/api/server-metrics",
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
		const metrics = await getServerMetricsData();
		return c.json(metrics, StatusCodes.OK);
	},
);

router.get(
	"/api/featured-mods",
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
		const result = await getAllFeaturedMods();

		return c.json(result, StatusCodes.OK);
	},
);

router.get(
	"/api/popular-mods",
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
		const result = await getAllPopularMods();

		return c.json(result, StatusCodes.OK);
	},
);

export default router;
