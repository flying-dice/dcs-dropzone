import { Hono } from "hono";
import { validator } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { describeJsonRoute } from "../../common/describeJsonRoute";
import disableRelease from "../commands/DisableRelease.ts";
import enableRelease from "../commands/EnableRelease.ts";
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
		await enableRelease({ releaseId, db: c.var.db, pathService: c.var.pathService });
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
		await disableRelease({
			releaseId,
			db: c.var.db,
		});
		return c.json(null, StatusCodes.OK);
	},
);

export default router;
