import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import { jwtVerify } from "jose";
import type { UserData } from "../services/auth.service.ts";
import { userDataSchema } from "../services/auth.service.ts";
import {StatusCodes} from "http-status-codes";
import appConfig from "../app-config.ts";

type Env = {
  Variables: {
    getUser: () => UserData;
  };
};

export const cookieAuth = () =>
  createMiddleware<Env>(async (c, next) => {
    const token = getCookie(c, appConfig.sessionCookieName);

    if (!token) {
      console.warn("No token found in cookie");
      throw new HTTPException(StatusCodes.UNAUTHORIZED);
    }

    const userToken = await jwtVerify(
      token,
      new TextEncoder().encode(appConfig.jwtSecret),
    );

    const user = userDataSchema.parse(userToken.payload);

    c.set("getUser", () => user);

    await next();
  });
