import { getLoggingHook } from "@packages/hono/getLoggingHook";
import { setSignedCookie } from "hono/cookie";
import { describeRoute, validator } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { getLogger } from "log4js";
import { z } from "zod";
import { appConfig } from "../config";
import ApplicationFactory, { authProvider } from "../hono/ApplicationFactory.ts";

const logger = getLogger("AuthProviderCallback");
const loggingHook = getLoggingHook(logger);

export const AuthProviderCallback = ApplicationFactory.createHandlers(
	describeRoute({
		operationId: "authProviderCallback",
		tags: ["Auth"],
		summary: "OAuth provider callback",
		description:
			"Handles the OAuth callback from the selected provider and establishes a user session via a signed cookie.",
		responses: {
			[StatusCodes.MOVED_TEMPORARILY]: {
				description: "Redirects the user to the homepage after successfully establishing a session.",
			},
		},
	}),
	validator("query", z.object({ code: z.string(), state: z.string() }), loggingHook),
	async (c) => {
		const { code, state } = c.req.valid("query");

		const authResult = await authProvider.handleCallback(code, state);

		const userData = await c.var.app.users.saveUserDetails(authResult);

		logger.debug("Setting signed cookie for user:", userData.id);
		await setSignedCookie(c, appConfig.userCookieName, userData.id, appConfig.userCookieSecret, {
			maxAge: appConfig.userCookieMaxAge,
		});

		return c.redirect(appConfig.authRedirectUrl);
	},
);
