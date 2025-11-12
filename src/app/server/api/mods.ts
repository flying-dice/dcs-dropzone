import { Hono } from "hono";
import { validator } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import ApplicationContext from "../Application.ts";
import Logger from "../Logger.ts";
import { ModData } from "../schemas/ModData.ts";
import { PageData } from "../schemas/PageData.ts";
import { describeJsonRoute } from "./describeJsonRoute.ts";

const router = new Hono();

const logger = Logger.getLogger("api/mods");

/**
 * GET /api/mods - List all mods (summary view)
 */
router.get(
	"/",
	describeJsonRoute({
		operationId: "getMods",
		tags: ["Mods"],
		responses: {
			[StatusCodes.OK]: z.object({
				data: z.array(ModData),
				page: PageData,
			}),
		},
	}),
	validator(
		"query",
		z.object({ page: PageData.shape.number, size: PageData.shape.size }),
	),
	async (c) => {
		const { page, size } = c.req.valid("query");

		const result = await ApplicationContext.modService.findAllPublishedMods(
			page,
			size,
		);

		return c.json({ data: result.data, page: result.page }, StatusCodes.OK);
	},
);

export default router;
