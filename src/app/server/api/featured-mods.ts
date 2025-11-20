import { Hono } from "hono";
import { StatusCodes } from "http-status-codes";
import ApplicationContext from "../Application.ts";
import Logger from "../Logger.ts";
import { ModData } from "../schemas/ModData.ts";
import { describeJsonRoute } from "./describeJsonRoute.ts";

const router = new Hono();

const _logger = Logger.getLogger("api/featured-mods");

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
		},
	}),
	async (c) => {
		const result = await ApplicationContext.modService.findAllFeaturedMods();

		return c.json(result, StatusCodes.OK);
	},
);

export default router;
