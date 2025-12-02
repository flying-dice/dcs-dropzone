import { Hono } from "hono";
import { validator } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { describeJsonRoute } from "../../common/describeJsonRoute";
import type { AppContext } from "../middleware/appContext.ts";

const router = new Hono<AppContext>();

router.post(
	"/:releaseId/enable",
	describeJsonRoute({
		operationId: "enableRelease",
		tags: ["Toggle"],
		summary: "Enable a release by creating its symbolic links",
		responses: { [StatusCodes.OK]: null },
	}),
	validator("param", z.object({ releaseId: z.string() })),
	async (c) => {
		const { releaseId } = c.req.valid("param");
		c.var.toggleService.enableRelease(releaseId);
		return c.json(null, StatusCodes.OK);
	},
);

router.post(
	"/:releaseId/disable",
	describeJsonRoute({
		operationId: "disableRelease",
		tags: ["Toggle"],
		summary: "Disable a release by removing its symbolic links",
		responses: { [StatusCodes.OK]: null },
	}),
	validator("param", z.object({ releaseId: z.string() })),
	async (c) => {
		const { releaseId } = c.req.valid("param");
		c.var.toggleService.disableRelease(releaseId);
		return c.json(null, StatusCodes.OK);
	},
);

export default router;
