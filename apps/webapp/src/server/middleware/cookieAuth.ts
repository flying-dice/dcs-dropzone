import { getSignedCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { StatusCodes } from "http-status-codes";
import { getLogger } from "log4js";
import appConfig from "../ApplicationConfig.ts";
import getUserById, { type GetUserByIdResult } from "../queries/GetUserById.ts";
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

		if (!appConfig.userCookieSecret) {
			logger.error("Cookie secret not configured");
			throw new HTTPException(StatusCodes.INTERNAL_SERVER_ERROR);
		}

		logger.debug({ requestId }, "Retrieving token from cookie");
		const userId = await getSignedCookie(c, appConfig.userCookieSecret, appConfig.userCookieName);

		if (!userId) {
			logger.warn({ requestId }, "No signed cookie found");
			throw new HTTPException(StatusCodes.UNAUTHORIZED);
		}

		let result: GetUserByIdResult;

		try {
			logger.debug({ requestId, userId }, "Loading authenticated user");
			result = await getUserById(userId);
		} catch (error) {
			logger.warn({ requestId, error }, "Error loading user for token");
			throw new HTTPException(StatusCodes.INTERNAL_SERVER_ERROR);
		}

		result.match(
			(user) => {
				logger.debug({ requestId, userId: user.id }, "Authenticated user loaded");
				c.set("getUser", () => user);
			},
			(error) => {
				logger.warn({ requestId, error }, "User not found for token");
				throw new HTTPException(StatusCodes.UNAUTHORIZED);
			},
		);

		await next();
	});
