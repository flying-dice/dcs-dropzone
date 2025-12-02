import { Hono } from "hono";
import { StatusCodes } from "http-status-codes";
import { getLogger } from "log4js";
import { describeJsonRoute } from "../../../common/describeJsonRoute.ts";
import { getAllFeaturedMods } from "../queries/GetAllFeaturedMods.ts";
import { ErrorData } from "../schemas/ErrorData.ts";
import { ModData } from "../schemas/ModData.ts";

const router = new Hono();

const _logger = getLogger("api/featured-mods");

/**
 * GET /api/featured-mods - List all featured mods (summary view)
 */
router.get(
	"/",
	describeJsonRoute({
		operationId: "getFeaturedMods",
		summary: "Get Featured mods",
		description: "Retrieves a set of featured mods.",
		tags: ["Mods"],
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

export default router;
