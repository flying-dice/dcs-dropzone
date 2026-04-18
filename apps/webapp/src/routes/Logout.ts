import { deleteCookie } from "hono/cookie";
import { describeRoute } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { appConfig } from "../config";
import ApplicationFactory from "../hono/ApplicationFactory.ts";

export const Logout = ApplicationFactory.createHandlers(
	describeRoute({
		operationId: "logout",
		tags: ["Auth"],
		summary: "Logout",
		description: "Clears the authentication cookie and redirects to the homepage.",
		responses: {
			[StatusCodes.MOVED_TEMPORARILY]: {
				description: "Redirects the user to the homepage after logout.",
			},
			[StatusCodes.UNAUTHORIZED]: {
				description: "If the session is missing or invalid, the cookie is simply not present; redirect still occurs.",
			},
		},
	}),
	(c) => {
		deleteCookie(c, appConfig.userCookieName);
		return c.redirect(appConfig.authRedirectUrl);
	},
);
