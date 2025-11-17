import { Hono } from "hono";
import { deleteCookie, setSignedCookie } from "hono/cookie";
import { describeRoute, validator } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import ApplicationContext from "../Application.ts";
import appConfig from "../ApplicationConfig.ts";
import Logger from "../Logger.ts";
import { cookieAuth } from "../middleware/cookieAuth.ts";
import { UserData } from "../schemas/UserData.ts";
import { AuthServiceProvider } from "../services/AuthServiceProvider.ts";
import { describeJsonRoute } from "./describeJsonRoute.ts";

const params = z.object({
	provider: z.enum(AuthServiceProvider),
});

const router = new Hono();
const logger = Logger.getLogger("api/auth");

router.get(
    "/:provider/callback",
    describeRoute({
        operationId: "authProviderCallback",
        tags: ["Auth"],
        summary: "OAuth provider callback",
        description:
            "Handles the OAuth callback from the selected provider and establishes a user session via a signed cookie.",
        parameters: [
            {
                in: "path",
                name: "provider",
                required: true,
                description: "Authentication provider",
                schema: { type: "string", enum: AuthServiceProvider as unknown as string[] },
            },
            {
                in: "query",
                name: "code",
                required: true,
                description: "OAuth authorization code returned by the provider",
                schema: { type: "string" },
            },
            {
                in: "query",
                name: "state",
                required: true,
                description: "CSRF state value used during the OAuth flow",
                schema: { type: "string" },
            },
        ],
        responses: {
            302: {
                description: "Redirects the user to the homepage after successfully establishing a session.",
            },
        },
    }),
	validator("param", params),
	validator("query", z.object({ code: z.string(), state: z.string() })),
	async (c) => {
		const provider = c.req.valid("param").provider;
		logger.debug({ provider }, "Auth callback start");
		const authService = ApplicationContext.getAuthService(provider);

		const { code, state } = c.req.valid("query");

		const authResult = await authService.handleCallback(code, state);

		logger.debug(
			{ provider, userId: authResult.id, username: authResult.username },
			"Auth callback success",
		);

		const userData =
			await ApplicationContext.userService.handleAuthResult(authResult);

		logger.debug(
			{ userId: authResult.id },
			"Session token issued; setting cookie",
		);

		await setSignedCookie(
			c,
			appConfig.userCookieName,
			userData.id,
			appConfig.userCookieSecret,
			{
				secure: true,
				sameSite: "strict",
				prefix: "secure",
				maxAge: appConfig.userCookieMaxAge,
			},
		);

		return c.redirect(appConfig.ghHomepageUrl);
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
        parameters: [
            {
                in: "path",
                name: "provider",
                required: true,
                description: "Authentication provider",
                schema: { type: "string", enum: AuthServiceProvider as unknown as string[] },
            },
        ],
        responses: {
            302: { description: "Redirects the user agent to the provider authorization URL." },
        },
    }),
	validator("param", params),
	(c) => {
		const provider = c.req.valid("param").provider;
		const authService = ApplicationContext.getAuthService(provider);
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
            [StatusCodes.UNAUTHORIZED]: null,
        },
    }),
    cookieAuth(),
	(c) => {
		const user = c.var.getUser();
		logger.debug(
			{ userId: user.id, username: user.username },
			"Returning authenticated user",
		);
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
        security: [{ cookieAuth: [] }],
        responses: {
            302: { description: "Redirects the user to the homepage after logout." },
            401: { description: "If the session is missing or invalid, the cookie is simply not present; redirect still occurs." },
        },
    }),
	(c) => {
		deleteCookie(c, appConfig.userCookieName, {
			secure: true,
			sameSite: "strict",
			prefix: "secure",
		});
		return c.redirect(appConfig.ghHomepageUrl);
	},
);

export default router;
