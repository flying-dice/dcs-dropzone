import { Hono } from "hono";
import { validator } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { fromCsv } from "../../../common/fromCsv.ts";
import ApplicationContext from "../Application.ts";
import Logger from "../Logger.ts";
import { ModAvailableFilterData } from "../schemas/ModAvailableFilterData.ts";
import { ModData } from "../schemas/ModData.ts";
import { PageData } from "../schemas/PageData.ts";
import { describeJsonRoute } from "./describeJsonRoute.ts";

const router = new Hono();

const _logger = Logger.getLogger("api/mods");

/**
 * GET /api/mods - List all mods (summary view)
 */
router.get(
	"/",
	describeJsonRoute({
		operationId: "getMods",
		summary: "Get mods",
		description: "Retrieves a paginated list of all published mods.",
		tags: ["Mods"],
		responses: {
			[StatusCodes.OK]: z.object({
				data: z.array(ModData),
				page: PageData,
				filter: ModAvailableFilterData,
			}),
		},
	}),
	validator(
		"query",
		z.object({
			page: PageData.shape.number,
			size: PageData.shape.size,
			category: ModData.shape.category.optional(),
			maintainers: z.string().optional().transform(fromCsv),
			tags: z.string().optional().transform(fromCsv),
			term: z.string().optional(),
		}),
	),
	async (c) => {
		const { page, size, category, maintainers, tags, term } =
			c.req.valid("query");

		const result = await ApplicationContext.modService.findAllPublishedMods(
			page,
			size,
			{ category, maintainers, tags, term },
		);

		return c.json(result, StatusCodes.OK);
	},
);

export default router;
