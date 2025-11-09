import { Hono } from "hono";
import { deleteCookie, setCookie } from "hono/cookie";
import { describeRoute, resolver, validator } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import appConfig from "../app-config.ts";
import { UserDtoSchema } from "../dto/UserDto.ts";
import { cookieAuth } from "../middleware/cookieAuth.ts";
import { AuthServiceProvider, getAuthService, userService } from "../services";

const params = z.object({
	provider: z.enum(AuthServiceProvider),
});

const router = new Hono();

router.get(
	"/:provider/callback",
	describeRoute({
		summary: "OAuth provider callback",
		description:
			"Handles the OAuth provider's callback after the user has authenticated. The callback URL includes the user's access token and other information.",
		tags: ["Auth"],
	}),
	validator("param", params),
	validator("query", z.object({ code: z.string(), state: z.string() })),
	async (c) => {
		const provider = c.req.valid("param").provider;
		const authService = getAuthService(provider);

		const authResult = await authService.handleCallback(
			c.req.valid("query").code,
			c.req.valid("query").state,
		);

		const token = await userService.issueTokenForAuthResult(authResult);

		setCookie(c, appConfig.sessionCookieName, token);

		return c.redirect(appConfig.ghHomepageUrl);
	},
);

router.get(
	"/:provider/login",
	describeRoute({
		summary: "Redirect to OAuth provider login page",
		description:
			"Redirects the user to the OAuth provider's authorization page (e.g., GitHub) to initiate the authentication process.",
		tags: ["Auth"],
	}),
	validator("param", params),
	(c) => {
		const provider = c.req.valid("param").provider;
		const authService = getAuthService(provider);

		return c.redirect(authService.getWebFlowAuthorizationUrl());
	},
);

router.get(
	"/user",
	describeRoute({
		summary: "Get authenticated user data",
		description:
			"Returns the details of the authenticated user, including their ID, login, avatar URL, and profile URL.\n Requires a valid authentication session (cookie-based authentication).",
		tags: ["Auth"],
		security: [{ cookieAuth: [] }],
		responses: {
			[StatusCodes.OK]: {
				description: "Authenticated user data",
				content: {
					"application/json": { schema: resolver(UserDtoSchema) },
				},
			},
		},
	}),
	cookieAuth(),
	(c) => {
		const user = c.var.getUser();
		return c.json(
			UserDtoSchema.parse({
				id: user.id,
				name: user.name,
				login: user.login,
				avatarUrl: user.avatarUrl,
				profileUrl: user.profileUrl,
			}),
		);
	},
);

router.get(
	"/logout",
	describeRoute({
		summary: "Logout",
		description: "Logs the user out by clearing the session cookie.",
		tags: ["Auth"],
		security: [{ cookieAuth: [] }],
	}),
	(c) => {
		deleteCookie(c, appConfig.sessionCookieName);
		return c.redirect(appConfig.ghHomepageUrl);
	},
);

export default router;
