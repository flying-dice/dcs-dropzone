import { Hono } from "hono";
import { validator } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { getLogger } from "log4js";
import { z } from "zod";
import { describeJsonRoute } from "../../common/describeJsonRoute";
import type { AppContext } from "../middleware/appContext.ts";
import { ModAndReleaseData } from "../schemas/ModAndReleaseData";

const router = new Hono<AppContext>();

const logger = getLogger("api/subscribe");

router.post(
	"/",
	describeJsonRoute({
		operationId: "subscribeToModRelease",
		tags: ["Subscriptions"],
		summary: "Subscribe to mod, downloading the provided mod release",
		description:
			"Checks the daemon service health by performing a lightweight database operation.",
		responses: {
			[StatusCodes.OK]: null,
		},
	}),
	validator("json", ModAndReleaseData),

	async (c) => {
		const modAndRelease = await c.req.valid("json");

		logger.info(
			`Received subscription request for mod: ${modAndRelease.modName} (release: ${modAndRelease.version})`,
		);

		c.var.subscriptionService.subscribeToRelease(modAndRelease);

		return c.json(null, StatusCodes.OK);
	},
);

router.get(
	"/",
	describeJsonRoute({
		operationId: "getAllSubscriptions",
		tags: ["Subscriptions"],
		summary: "Get all mod subscriptions",
		description: "Retrieves a list of all mod subscriptions.",
		responses: {
			[StatusCodes.OK]: ModAndReleaseData.pick({
				modId: true,
				releaseId: true,
			})
				.extend({
					progressPercent: z.number().optional(),
				})
				.array(),
		},
	}),
	async (c) => {
		const subscriptions: {
			modId: string;
			releaseId: string;
			progressPercent?: number;
		}[] = c.var.subscriptionService.getAllSubscriptions();

		for (const sub of subscriptions) {
			sub.progressPercent = c.var.downloadQueue.getOverallProgressForRelease(
				sub.releaseId,
			);
		}

		return c.json(subscriptions, StatusCodes.OK);
	},
);

router.delete(
	"/:releaseId",
	describeJsonRoute({
		operationId: "unsubscribeFromModRelease",
		tags: ["Subscriptions"],
		summary: "Unsubscribe from a mod release",
		description: "Removes the subscription for the specified mod release.",
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
		c.var.subscriptionService.removeSubscription(releaseId);
		return c.json(null, StatusCodes.OK);
	},
);

export default router;
