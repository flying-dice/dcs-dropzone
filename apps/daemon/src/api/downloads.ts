import { describeJsonRoute } from "@packages/hono/describeJsonRoute";
import { Hono } from "hono";
import { validator } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import Application from "../Application.ts";
import type { AppContext } from "../middleware/appContext.ts";
import { ModAndReleaseData } from "../schemas/ModAndReleaseData";
import disableRelease from "../services/DisableRelease.ts";
import getAllDaemonReleases from "../services/GetAllDaemonReleases.ts";
import regenerateMissionScriptingFiles from "../services/RegenerateMissionScriptingFiles.ts";
import removeRelease from "../services/RemoveRelease.ts";

const router = new Hono<AppContext>();

router.post(
	"/",
	describeJsonRoute({
		operationId: "addReleaseToDaemon",
		tags: ["Downloads"],
		responses: {
			[StatusCodes.OK]: null,
		},
	}),
	validator("json", ModAndReleaseData),

	async (c) => {
		const modAndRelease = c.req.valid("json");

		await Application.addRelease({ data: modAndRelease });

		return c.json(null, StatusCodes.OK);
	},
);

router.get(
	"/",
	describeJsonRoute({
		operationId: "getAllDaemonReleases",
		tags: ["Downloads"],
		responses: {
			[StatusCodes.OK]: ModAndReleaseData.array(),
		},
	}),
	async (c) => {
		const subscriptions = getAllDaemonReleases({ db: c.var.db });

		return c.json(subscriptions, StatusCodes.OK);
	},
);

router.delete(
	"/:releaseId",
	describeJsonRoute({
		operationId: "removeReleaseFromDaemon",
		tags: ["Downloads"],
		responses: {
			[StatusCodes.OK]: null,
		},
	}),
	validator(
		"param",
		z.object({
			releaseId: z.string(),
		}),
	),
	async (c) => {
		const { releaseId } = c.req.valid("param");
		await removeRelease({
			db: c.var.db,
			downloadQueue: c.var.downloadQueue,
			extractQueue: c.var.extractQueue,
			pathService: c.var.pathService,
			releaseId,
			disableReleaseHandler: (releaseId) =>
				disableRelease({
					releaseId,
					db: c.var.db,
					regenerateMissionScriptFilesHandler: () =>
						regenerateMissionScriptingFiles({ db: c.var.db, pathService: c.var.pathService }),
				}),
		});

		return c.json(null, StatusCodes.OK);
	},
);

export default router;
