import { describeJsonRoute } from "@packages/hono/describeJsonRoute";
import { Hono } from "hono";
import { validator } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import Application from "../Application.ts";
import disableRelease from "../services/DisableRelease.ts";
import enableRelease from "../services/EnableRelease.ts";
import regenerateMissionScriptingFiles from "../services/RegenerateMissionScriptingFiles.ts";
import type { AppContext } from "../middleware/appContext.ts";
import { ErrorData } from "../schemas/ErrorData.ts";
import { OkData } from "../schemas/OkData.ts";

const router = new Hono<AppContext>();

router.post(
	"/:releaseId/enable",
	describeJsonRoute({
		operationId: "enableRelease",
		tags: ["Toggle"],
		summary: "Enable a release by creating its symbolic links",
		responses: { [StatusCodes.OK]: OkData, [StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData },
	}),
	validator("param", z.object({ releaseId: z.string() })),
	async (c) => {
		const { releaseId } = c.req.valid("param");
		await enableRelease({
			releaseId,
			db: c.var.db,
			pathService: c.var.pathService,
			regenerateMissionScriptFilesHandler: () =>
				regenerateMissionScriptingFiles({ pathService: Application.pathService, db: Application.db }),
		});
		return c.json(OkData.parse({ ok: true }), StatusCodes.OK);
	},
);

router.post(
	"/:releaseId/disable",
	describeJsonRoute({
		operationId: "disableRelease",
		tags: ["Toggle"],
		summary: "Disable a release by removing its symbolic links",
		responses: { [StatusCodes.OK]: OkData, [StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData },
	}),
	validator("param", z.object({ releaseId: z.string() })),
	async (c) => {
		const { releaseId } = c.req.valid("param");
		await disableRelease({
			releaseId,
			db: c.var.db,
			regenerateMissionScriptFilesHandler: () =>
				regenerateMissionScriptingFiles({ pathService: Application.pathService, db: Application.db }),
		});
		return c.json(OkData.parse({ ok: true }), StatusCodes.OK);
	},
);

export default router;
