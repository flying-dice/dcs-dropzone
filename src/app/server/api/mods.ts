import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { getLogger } from "log4js";
import { z } from "zod";
import { describeJsonRoute } from "../../../common/describeJsonRoute.ts";
import { fromCsv } from "../../../common/fromCsv.ts";
import ApplicationContext from "../Application.ts";
import { ModAvailableFilterData } from "../schemas/ModAvailableFilterData.ts";
import { ModData } from "../schemas/ModData.ts";
import { PageData } from "../schemas/PageData.ts";

const router = new Hono();

const _logger = getLogger("api/mods");

router.get(
	"/:id",
	describeJsonRoute({
		operationId: "getModById",
		summary: "Get mod by ID",
		description: "Retrieves a specific published mod by its ID.",
		tags: ["Mods"],
		responses: {
			[StatusCodes.OK]: ModData,
			[StatusCodes.NOT_FOUND]: z.object({
				message: z.string(),
			}),
		},
	}),
	validator(
		"param",
		z.object({
			id: z.string(),
		}),
	),
	async (c) => {
		const { id } = c.req.valid("param");

		const mod = await ApplicationContext.modService.findById(id);

		if (!mod) {
			throw new HTTPException(StatusCodes.NOT_FOUND);
		}

		return c.json(mod, StatusCodes.OK);
	},
);

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
