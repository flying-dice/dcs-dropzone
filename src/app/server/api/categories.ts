import { Hono } from "hono";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { ModCategory } from "../../../common/data.ts";
import { describeJsonRoute } from "../../../common/describeJsonRoute.ts";
import ApplicationContext from "../Application.ts";
import Logger from "../Logger.ts";

const router = new Hono();

const _logger = Logger.getLogger("api/categories");

/**
 * GET /api/categories - List all categories and their mod counts
 */
router.get(
	"/",
	describeJsonRoute({
		operationId: "getCategories",
		summary: "Get Categories",
		description:
			"Retrieves a list of all mod categories along with the count of published mods in each category.",
		tags: ["Categories"],
		responses: {
			[StatusCodes.OK]: z.record(z.enum(ModCategory), z.number()),
		},
	}),
	async (c) => {
		const result = await ApplicationContext.modService.getCategoryCounts();

		return c.json(result, StatusCodes.OK);
	},
);

export default router;
