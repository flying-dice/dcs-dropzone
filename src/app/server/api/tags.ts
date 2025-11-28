import { Hono } from "hono";
import { StatusCodes } from "http-status-codes";
import { getLogger } from "log4js";
import { z } from "zod";
import { describeJsonRoute } from "../../../common/describeJsonRoute.ts";
import ApplicationContext from "../Application.ts";

const router = new Hono();

const _logger = getLogger("api/tags");

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
