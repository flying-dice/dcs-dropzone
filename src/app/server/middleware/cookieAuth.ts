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
		const token = getCookie(c, appConfig.sessionCookieName);

		if (!token) {
			logger.warn("No token found in cookie");
			throw new HTTPException(StatusCodes.UNAUTHORIZED);
		}

		const userToken = await UserToken.fromTokenString(token);
		const user = await ApplicationContext.userService.getUserById(
			userToken.userId,
		);

		c.set("getUser", () => user);

		await next();
	});
