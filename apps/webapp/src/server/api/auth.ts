import { describeJsonRoute } from "@packages/hono/describeJsonRoute";
import { Hono } from "hono";
import { setSignedCookie } from "hono/cookie";
import { describeRoute, validator } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { getLogger } from "log4js";
import { z } from "zod";
import appConfig from "../ApplicationConfig.ts";
import handleAuthResult from "../commands/HandleAuthResult.ts";
import { cookieAuth } from "../infrastructure/http/middleware/cookieAuth.ts";
import { ErrorData } from "../application/schemas/ErrorData.ts";
import { UserData } from "../application/schemas/UserData.ts";
import { AuthServiceFactory } from "../services/AuthService/AuthServiceFactory.ts";
import { AuthServiceProvider } from "../services/AuthService/AuthServiceProvider.ts";

const params = z.object({
	provider: z.enum(AuthServiceProvider),
});

const router = new Hono();
const logger = getLogger("api/auth");

router.get(
	"/:provider/callback",
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
	validator("param", params),
	validator("query", z.object({ code: z.string(), state: z.string() })),
	async (c) => {
		const provider = c.req.valid("param").provider;
		logger.debug({ provider }, "Auth callback start");
		const authService = AuthServiceFactory.getAuthService(provider);

		const { code, state } = c.req.valid("query");

		const authResult = await authService.handleCallback(code, state);

		logger.debug({ provider, userId: authResult.id, username: authResult.username }, "Auth callback success");

		const userData = await handleAuthResult({ authResult });

		logger.debug({ userId: authResult.id }, "Session token issued; setting cookie");

		await setSignedCookie(c, appConfig.userCookieName, userData.id, appConfig.userCookieSecret, {
			maxAge: appConfig.userCookieMaxAge,
		});

		logger.debug({ userId: authResult.id }, "Signed Cookie Set");

		return c.redirect(appConfig.homepageUrl);
	},
);

router.get(
	"/:provider/login",
	describeRoute({
		operationId: "authProviderLogin",
		tags: ["Auth"],
		summary: "Start OAuth login",
		description:
			"Initiates the OAuth web flow for the selected provider and redirects the user to the provider's authorization page.",
		responses: {
			[StatusCodes.MOVED_TEMPORARILY]: {
				description: "Redirects the user agent to the provider authorization URL.",
			},
		},
	}),
	validator("param", params),
	(c) => {
		const provider = c.req.valid("param").provider;
		const authService = AuthServiceFactory.getAuthService(provider);
		logger.debug({ provider }, "Auth login redirect");
		return c.redirect(authService.getWebFlowAuthorizationUrl());
	},
);

router.get(
	"/user",
	describeJsonRoute({
		tags: ["Auth"],
		operationId: "getAuthenticatedUser",
		summary: "Get authenticated user",
		description: "Returns the authenticated user's profile derived from the session cookie.",
		security: [{ cookieAuth: [] }],
		responses: {
			[StatusCodes.OK]: UserData,
			[StatusCodes.UNAUTHORIZED]: ErrorData,
		},
	}),
	cookieAuth(),
	(c) => {
		const user = c.var.getUser();
		logger.debug({ userId: user.id, username: user.username }, "Returning authenticated user");
		return c.json(user);
	},
);

router.get(
	"/logout",
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
		return c.redirect(appConfig.homepageUrl ?? "http://localhost:3000");
	},
);

export default router;
