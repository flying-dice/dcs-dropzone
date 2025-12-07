import { describeJsonRoute } from "hono-utils/describeJsonRoute";
import { Hono } from "hono";
import { validator } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import getAllFeaturedMods from "../queries/GetAllFeaturedMods.ts";
import getAllPopularMods from "../queries/GetAllPopularMods.ts";
import getServerMetricsData from "../queries/GetServerMetricsData.ts";
import { DaemonInstalledVersionsData } from "../schemas/DaemonInstalledVersionsData.ts";
import { ErrorData } from "../schemas/ErrorData.ts";
import { ModData } from "../schemas/ModData.ts";
import { ServerMetricsData } from "../schemas/ServerMetricsData.ts";

const router = new Hono();

router.post(
	"/api/dashboard-metrics",
	describeJsonRoute({
		operationId: "getServerDashboardMetrics",
		summary: "Get Server Dashboard Metrics",
		description: "Retrieves various metrics for the dashboard.",
		tags: ["Dashboard"],
		responses: {
			[StatusCodes.OK]: ServerMetricsData,
			[StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData,
		},
	}),
	validator("json", DaemonInstalledVersionsData.array()),
	async (c) => {
		const daemonInstalledVersions = c.req.valid("json");
		const metrics = await getServerMetricsData({ daemonInstalledVersions });
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
			[StatusCodes.OK]: ModData.array(),
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
			[StatusCodes.OK]: ModData.array(),
			[StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData,
		},
	}),
	async (c) => {
		const result = await getAllPopularMods();

		return c.json(result, StatusCodes.OK);
	},
);

export default router;
