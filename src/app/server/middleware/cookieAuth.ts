import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { StatusCodes } from "http-status-codes";
import ApplicationContext from "../Application.ts";
import appConfig from "../ApplicationConfig.ts";
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

		let user: UserData;

		try {
			logger.debug(
				{ requestId, token },
				"Loading authenticated user for token",
			);
			user = await ApplicationContext.userService.getUserByToken(token);
			logger.debug({ requestId, userId: user.id }, "Authenticated user loaded");
		} catch (error) {
			logger.warn({ requestId, error }, "User not found for token");
			throw new HTTPException(StatusCodes.UNAUTHORIZED);
		}

		c.set("getUser", () => user);

		await next();
	});
