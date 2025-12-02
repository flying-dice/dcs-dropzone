import { getSignedCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { StatusCodes } from "http-status-codes";
import { getLogger } from "log4js";
import appConfig from "../ApplicationConfig.ts";
import { getUserById } from "../queries/GetUserById.ts";
import type { UserData } from "../schemas/UserData.ts";

const logger = getLogger("cookieAuth");

type Env = {
	Variables: {
		getUser: () => UserData;
	};
};

export const cookieAuth = () =>
	createMiddleware<Env>(async (c, next) => {
		const requestId = c.get("requestId");
		logger.debug({ requestId }, "Authenticating via cookie");

		logger.debug({ requestId }, "Retrieving token from cookie");
		const userId = await getSignedCookie(c, appConfig.userCookieSecret, appConfig.userCookieName);

		if (!userId) {
			logger.warn({ requestId }, "No signed cookie found");
			throw new HTTPException(StatusCodes.UNAUTHORIZED);
		}

		let user: UserData;

		try {
			logger.debug({ requestId, userId }, "Loading authenticated user");
			user = await getUserById(userId);
			logger.debug({ requestId, userId: user.id }, "Authenticated user loaded");
		} catch (error) {
			logger.warn({ requestId, error }, "User not found for token");
			throw new HTTPException(StatusCodes.UNAUTHORIZED);
		}

		c.set("getUser", () => user);

		await next();
	});
