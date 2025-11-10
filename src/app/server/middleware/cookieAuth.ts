import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { StatusCodes } from "http-status-codes";
import appConfig from "../ApplicationConfig.ts";
import ApplicationContext from "../ApplicationContext.ts";
import { UserToken } from "../domain/UserToken.ts";
import Logger from "../Logger.ts";
import type { UserData } from "../schemas/UserData.ts";

const logger = Logger.getLogger("cookieAuth");

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
		const token = getCookie(c, appConfig.sessionCookieName);

		if (!token) {
			logger.warn({ requestId }, "No token found in cookie");
			throw new HTTPException(StatusCodes.UNAUTHORIZED);
		}

		let userToken: UserToken;

		try {
			logger.debug({ requestId }, "Verifying token from cookie");
			userToken = await UserToken.fromTokenString(token);
			logger.debug({ requestId, userId: userToken.userId }, "Token verified");
		} catch (error) {
			logger.warn({ requestId, error }, "Invalid token in cookie");
			throw new HTTPException(StatusCodes.UNAUTHORIZED);
		}

		let user: UserData;

		try {
			logger.debug(
				{ requestId, userId: userToken.userId },
				"Loading authenticated user",
			);
			user = await ApplicationContext.userService.getUserById(userToken.userId);
			logger.debug({ requestId, userId: user.id }, "Authenticated user loaded");
		} catch (error) {
			logger.warn({ requestId, error }, "User not found for token");
			throw new HTTPException(StatusCodes.UNAUTHORIZED);
		}

		c.set("getUser", () => user);

		await next();
	});
