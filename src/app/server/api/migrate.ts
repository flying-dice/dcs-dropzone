import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { StatusCodes } from "http-status-codes";
import Application from "../Application.ts";
import appConfig from "../ApplicationConfig.ts";
import Logger from "../Logger.ts";
import { cookieAuth } from "../middleware/cookieAuth.ts";
import { ErrorData } from "../schemas/ErrorData.ts";
import { describeJsonRoute } from "./describeJsonRoute.ts";

const router = new Hono();
const logger = Logger.getLogger("api/migrate");

router.get(
	"/",
	describeJsonRoute({
		operationId: "migrateLegacyRegistry",
		summary: "Migrate Legacy Registry",
		description:
			"Migrates data from the legacy registry to the new system. Only accessible by the admin users.",
		tags: ["Migration"],
		responses: {
			[StatusCodes.OK]: null,
			[StatusCodes.UNAUTHORIZED]: null,
		},
	}),
	cookieAuth(),
	async (c) => {
		const user = c.var.getUser();
		logger.debug(
			{ userId: user.id, admins: appConfig.admins },
			"Migration requested by user",
		);
		if (!appConfig.admins.includes(user.id)) {
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
