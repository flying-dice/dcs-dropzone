import { Hono } from "hono";
import { StatusCodes } from "http-status-codes";
import { getLogger } from "log4js";
import { z } from "zod";
import { ModCategory } from "../../../common/data.ts";
import { describeJsonRoute } from "../../../common/describeJsonRoute.ts";
import { getCategoryCounts } from "../queries/GetCategoryCounts.ts";
import { ErrorData } from "../schemas/ErrorData.ts";

const router = new Hono();

const _logger = getLogger("api/categories");

/**
 * GET /api/categories - List all categories and their mod counts
 */
router.get(
	"/",
	describeJsonRoute({
		operationId: "getCategories",
		summary: "Get Categories",
		description: "Retrieves a list of all mod categories along with the count of published mods in each category.",
		tags: ["Categories"],
		responses: {
			[StatusCodes.OK]: z.record(z.enum(ModCategory), z.number()),
			[StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData,
		},
	}),
	async (c) => {
		const result = await getCategoryCounts();

		return c.json(result, StatusCodes.OK);
	},
);

export default router;
