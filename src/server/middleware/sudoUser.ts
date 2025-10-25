import {createMiddleware} from "hono/factory";
import {getCookie} from "hono/cookie";
import {HTTPException} from "hono/http-exception";
import {jwtVerify} from "jose";
import {type UserData, userDataSchema} from "../services/auth.service.ts";
import appConfig from "../app-config.ts";
import {HttpStatusCode} from "axios";

export const sudoUser = () =>
  createMiddleware(async (c, next) => {
    const token = getCookie(c, appConfig.sessionCookieName);

    if (!token) {
      console.warn("No token found in cookie");
      throw new HTTPException(HttpStatusCode.Unauthorized);
    }

    const userToken = await jwtVerify<UserData>(
      token,
      new TextEncoder().encode(appConfig.jwtSecret),
    );

    const { userId } = userDataSchema.parse(userToken.payload);

    if (appConfig.sudoUsers.includes(userId)) {
      await next();
    } else {
      console.warn("User is not a sudo user");
      throw new HTTPException(HttpStatusCode.Unauthorized);
    }
  });
