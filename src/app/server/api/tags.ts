import { Hono } from "hono";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import ApplicationContext from "../Application.ts";
import Logger from "../Logger.ts";
import { describeJsonRoute } from "./describeJsonRoute.ts";

const router = new Hono();

const _logger = Logger.getLogger("api/tags");

/**
 * GET /api/tags - List all tags
 */
router.get(
	"/",
	describeJsonRoute({
		operationId: "getTags",
		summary: "Get Tags",
		description: "Retrieves a list of all tags.",
		tags: ["Tags"],
		responses: {
			[StatusCodes.OK]: z.string().array(),
		},
	}),
	async (c) => {
		const result = await ApplicationContext.modService.getAllTags();

		return c.json(z.string().array().parse(result), StatusCodes.OK);
	},
);

export default router;
