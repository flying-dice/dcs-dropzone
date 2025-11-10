import { Hono } from "hono";
import { StatusCodes } from "http-status-codes";
import Database from "../Database.ts";
import Logger from "../Logger.ts";
import { ErrorData } from "../schemas/ErrorData.ts";
import { describeJsonRoute } from "./describeJsonRoute.ts";

const router = new Hono();
const logger = Logger.getLogger("api/health");

router.get(
	"/",
	describeJsonRoute({
		responses: {
			[StatusCodes.OK]: null,
			[StatusCodes.SERVICE_UNAVAILABLE]: ErrorData,
		},
	}),
	async (c) => {
		try {
			logger.debug("Health check ping start");
			await Database.ping();
			logger.debug("Health check ping success");
			return c.body(null, StatusCodes.OK);
		} catch (error) {
			logger.warn({ error: String(error) }, "Health check ping failure");
			return c.json(
				ErrorData.parse({ error: String(error) }),
				StatusCodes.SERVICE_UNAVAILABLE,
			);
		}
	},
);

export default router;
