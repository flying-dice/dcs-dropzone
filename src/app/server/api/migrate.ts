import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { StatusCodes } from "http-status-codes";
import Application from "../Application.ts";
import Logger from "../Logger.ts";
import { cookieAuth } from "../middleware/cookieAuth.ts";
import { ErrorData } from "../schemas/ErrorData.ts";
import { describeJsonRoute } from "./describeJsonRoute.ts";

const router = new Hono();
const logger = Logger.getLogger("api/migrate");

router.get(
	"/",
	describeJsonRoute({
		responses: {
			[StatusCodes.OK]: null,
			[StatusCodes.SERVICE_UNAVAILABLE]: ErrorData,
		},
	}),
	cookieAuth(),
	async (c) => {
		const user = await c.var.getUser();
		if (user.id !== "16135506") {
			throw new HTTPException(StatusCodes.UNAUTHORIZED);
		}

		try {
			await Application.modService.migrateLegacyRegistry();

			return c.body(null, StatusCodes.OK);
		} catch (error) {
			logger.warn({ error: String(error) }, "Migration failure");
			return c.json(
				ErrorData.parse({ error: String(error) }),
				StatusCodes.SERVICE_UNAVAILABLE,
			);
		}
	},
);

export default router;
