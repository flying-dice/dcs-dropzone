import { describeJsonRoute } from "@packages/hono/describeJsonRoute";
import { Hono } from "hono";
import { validator } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import addRelease from "../commands/AddRelease.ts";
import disableRelease from "../commands/DisableRelease.ts";
import removeRelease from "../commands/RemoveRelease.ts";
import type { AppContext } from "../middleware/appContext.ts";
import getAllDaemonReleases from "../queries/GetAllDaemonReleases.ts";
import { ModAndReleaseData } from "../schemas/ModAndReleaseData";

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

		await addRelease({
			data: modAndRelease,
			downloadQueue: c.var.downloadQueue,
			extractQueue: c.var.extractQueue,
			pathService: c.var.pathService,
			db: c.var.db,
		});

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
			disableReleaseHandler: disableRelease,
		});

		return c.json(null, StatusCodes.OK);
	},
);

export default router;
