import { Hono } from "hono";
import { StatusCodes } from "http-status-codes";
import { describeJsonRoute } from "../../common/describeJsonRoute";
import { ModAndReleaseData } from "../schemas/ModAndReleaseData";
import { validator } from "hono-openapi";
import Logger from "../Logger";

const router = new Hono();

const logger = Logger.getLogger("api/subscribe");

router.post(
	"/",
	describeJsonRoute({
		tags: ["Mods"],
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
			`Received subscription request for mod: ${modAndRelease.mod_name} (release: ${modAndRelease.version})`,
		);

		// TODO: Implement subscription logic

		return c.json(null, StatusCodes.OK);
	},
);

export default router;
