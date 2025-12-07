import { describeJsonRoute } from "common/describeJsonRoute";
import { Hono } from "hono";
import { validator } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import getAllPublishedMods from "../queries/GetAllPublishedMods.ts";
import getModById from "../queries/GetModById.ts";
import { ErrorData } from "../schemas/ErrorData.ts";
import { ModAvailableFilterData } from "../schemas/ModAvailableFilterData.ts";
import { ModData } from "../schemas/ModData.ts";
import { PageData } from "../schemas/PageData.ts";
import { fromCsv } from "../utils/fromCsv.ts";

const router = new Hono();

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
			[StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData,
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

		const result = await getModById(id);

		return result.match(
			(mod) => c.json(mod, StatusCodes.OK),
			(error) => c.json(ErrorData.parse(<ErrorData>{ code: StatusCodes.NOT_FOUND, error })),
		);
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
			[StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData,
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
		const { page, size, category, maintainers, tags, term } = c.req.valid("query");

		const result = await getAllPublishedMods({
			page,
			size,
			filter: {
				category,
				maintainers,
				tags,
				term,
			},
		});

		return c.json(result, StatusCodes.OK);
	},
);

export default router;
