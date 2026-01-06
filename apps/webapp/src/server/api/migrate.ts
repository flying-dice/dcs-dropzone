import { describeJsonRoute } from "@packages/hono/describeJsonRoute";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { StatusCodes } from "http-status-codes";
import { getLogger } from "log4js";
import appConfig from "../ApplicationConfig.ts";
import migrateLegacyRegistry from "../commands/MigrateLegacyRegistry.ts";
import { cookieAuth } from "../infrastructure/http/middleware/cookieAuth.ts";
import { ErrorData } from "../application/schemas/ErrorData.ts";
import { OkData } from "../application/schemas/OkData.ts";

const router = new Hono();
const logger = getLogger("api/migrate");

router.get(
	"/",
	describeJsonRoute({
		operationId: "migrateLegacyRegistry",
		summary: "Migrate Legacy Registry",
		description: "Migrates data from the legacy registry to the new system. Only accessible by the admin users.",
		tags: ["Migration"],
		responses: {
			[StatusCodes.OK]: OkData,
			[StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData,
		},
	}),
	cookieAuth(),
	async (c) => {
		const user = c.var.getUser();
		logger.debug({ userId: user.id, admins: appConfig.admins }, "Migration requested by user");
		if (!appConfig.admins?.includes(user.id)) {
			throw new HTTPException(StatusCodes.UNAUTHORIZED);
		}

		await migrateLegacyRegistry({ user });

		return c.json(OkData.parse({ ok: true }), StatusCodes.OK);
	},
);

export default router;
