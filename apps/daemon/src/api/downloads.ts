import { describeJsonRoute } from "@packages/hono/describeJsonRoute";
import { Hono } from "hono";
import { validator } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import Application from "../Application.ts";
import { ModAndReleaseData } from "../schemas/ModAndReleaseData";
import getAllDaemonReleases from "../services/GetAllDaemonReleases.ts";
import removeRelease from "../services/RemoveRelease.ts";

const router = new Hono();

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

		await Application.addRelease.execute(modAndRelease);

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
		const subscriptions = getAllDaemonReleases({ db: Application.db });

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
			db: Application.db,
			downloadQueue: Application.downloadQueue,
			extractQueue: Application.extractQueue,
			pathService: Application.pathService,
			releaseId,
			disableReleaseHandler: (releaseId) => Application.disableRelease.execute(releaseId),
		});

		return c.json(null, StatusCodes.OK);
	},
);

export default router;
