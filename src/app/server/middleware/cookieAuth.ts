import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { StatusCodes } from "http-status-codes";
import appConfig from "../app-config.ts";
import { UserToken } from "../domain/UserToken.ts";
import type { UserDto } from "../dto/UserDto.ts";
import { userService } from "../services";

type Env = {
	Variables: {
		getUser: () => UserDto;
	};
};

export const cookieAuth = () =>
	createMiddleware<Env>(async (c, next) => {
		const token = getCookie(c, appConfig.sessionCookieName);

		if (!token) {
			console.warn("No token found in cookie");
			throw new HTTPException(StatusCodes.UNAUTHORIZED);
		}

		const userToken = await UserToken.fromTokenString(token);
		const user = await userService.getUserById(userToken.userId);

		c.set("getUser", () => user);

		await next();
	});
