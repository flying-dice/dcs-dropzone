import { Hono } from "hono";
import { validator } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { describeJsonRoute } from "../../common/describeJsonRoute";
import type { AppContext } from "../middleware/appContext.ts";
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

		await c.var.downloadsService.add(modAndRelease);

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
		const subscriptions = c.var.downloadsService.getAll();

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
		await c.var.downloadsService.remove(releaseId);
		return c.json(null, StatusCodes.OK);
	},
);

export default router;
