import { getSignedCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { StatusCodes } from "http-status-codes";
import { getLogger } from "log4js";
import appConfig from "../../ApplicationConfig.ts";
import type { Application } from "../../application/Application.ts";
import type { UserData } from "../../application/schemas/UserData.ts";

const logger = getLogger("cookieAuth");

type Env = {
	Variables: {
		app: Application;
		getUser: () => UserData;
	};
};

export const cookieAuth = () =>
	createMiddleware<Env>(async (c, next) => {
		const requestId = c.get("requestId");
		logger.debug({ requestId }, "Authenticating via cookie");

		logger.debug({ requestId }, "Retrieving token from cookie");
		const userId = await getSignedCookie(c, appConfig.userCookieSecret!, appConfig.userCookieName);

		if (!userId) {
			logger.warn({ requestId }, "No signed cookie found");
			throw new HTTPException(StatusCodes.UNAUTHORIZED);
		}

		try {
			logger.debug({ requestId, userId }, "Loading authenticated user");
			const result = await c.var.app.users.getUserById(userId);

			result.match(
				(user: UserData) => {
					logger.debug({ requestId, userId: user.id }, "Authenticated user loaded");
					c.set("getUser", () => user);
				},
				(error: string) => {
					logger.warn({ requestId, error }, "User not found for token");
					throw new HTTPException(StatusCodes.UNAUTHORIZED);
				},
			);
		} catch (error) {
			if (error instanceof HTTPException) {
				throw error;
			}
			logger.warn({ requestId, error }, "Error loading user for token");
			throw new HTTPException(StatusCodes.INTERNAL_SERVER_ERROR);
		}

		await next();
	});
