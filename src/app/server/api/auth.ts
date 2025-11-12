import { Hono } from "hono";
import { deleteCookie, setCookie } from "hono/cookie";
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
		tags: ["Auth"],
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

		const token =
			await ApplicationContext.userService.refreshUserAndIssueTokenForAuthResult(
				authResult,
			);

		logger.debug(
			{ userId: authResult.id },
			"Session token issued; setting cookie",
		);

		setCookie(c, appConfig.sessionCookieName, token);

		return c.redirect(appConfig.ghHomepageUrl);
	},
);

router.get(
	"/:provider/login",
	describeRoute({
		tags: ["Auth"],
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
		security: [{ cookieAuth: [] }],
		responses: {
			[StatusCodes.OK]: UserData,
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
		tags: ["Auth"],
		security: [{ cookieAuth: [] }],
	}),
	(c) => {
		deleteCookie(c, appConfig.sessionCookieName);
		return c.redirect(appConfig.ghHomepageUrl);
	},
);

export default router;
