import "../mongo-db";
import { describeJsonRoute } from "@packages/hono/describeJsonRoute";
import { jsonErrorTransformer } from "@packages/hono/jsonErrorTransformer";
import { requestResponseLogger } from "@packages/hono/requestResponseLogger";
import { Scalar } from "@scalar/hono-api-reference";
import { Hono } from "hono";
import { setSignedCookie } from "hono/cookie";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import { describeRoute, openAPIRouteHandler, validator } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import appConfig from "../ApplicationConfig.ts";
import type { Application } from "../application/Application.ts";
import { ErrorData } from "../application/schemas/ErrorData.ts";
import { UserData } from "../application/schemas/UserData.ts";
import Database from "../database";
import { cookieAuth } from "./middleware/cookieAuth.ts";
import categories from "./routes/categories.ts";
import featuredMods from "./routes/dashboard.ts";
import migrate from "./routes/migrate.ts";
import modReleases from "./routes/mod-releases.ts";
import mods from "./routes/mods.ts";
import tags from "./routes/tags.ts";
import userModReleases from "./routes/user-mod-releases.ts";
import userMods from "./routes/user-mods.ts";

type Env = {
	Variables: {
		app: Application;
	};
};

export class HonoApplication extends Hono<Env> {
	constructor(app: Application) {
		super();

		this.use("*", (c, next) => {
			c.set("app", app);
			return next();
		});

		this.use("/*", cors());

		this.use(requestId());

		this.use("*", requestResponseLogger);

		this.authProviderCallback();
		this.authProviderLogin();
		this.getAuthenticatedUser();
		this.logout();
		this.health();

		this.route("/api/user-mods", userMods);
		this.route("/api/user-mods", userModReleases);
		this.route("/api/mods", mods);
		this.route("/api/mods", modReleases);
		this.route("/", featuredMods);
		this.route("/api/categories", categories);
		this.route("/api/tags", tags);
		this.route("/api/_migrate", migrate);

		this.get(
			"/v3/api-docs",
			openAPIRouteHandler(this, {
				documentation: {
					info: {
						title: "DCS Dropzone Registry API",
						version: "1.0.0",
						description: "API documentation for the DCS Dropzone Registry.",
					},
					tags: [
						{ name: "Auth", description: "Authentication and session management" },
						{ name: "Health", description: "Service health and readiness" },
						{ name: "Mods", description: "Public mod catalogue endpoints" },
						{ name: "Mod Releases", description: "Public mod release endpoints" },
						{
							name: "User Mods",
							description: "Manage mods owned by the authenticated user",
						},
						{
							name: "User Mod Releases",
							description: "Manage releases for user-owned mods",
						},
						{
							name: "Migration",
							description: "Administrative data migration endpoints",
						},
					],
					components: {
						securitySchemes: {
							cookieAuth: {
								type: "apiKey",
								in: "cookie",
								name: appConfig.userCookieName,
								description: "Session cookie used for authenticating user endpoints. Set after successful OAuth login.",
							},
						},
					},
				},
			}),
		);

		this.get("/api", Scalar({ url: "/v3/api-docs" }));

		this.onError(jsonErrorTransformer);
	}

	private health() {
		this.get(
			"/api/health",
			describeJsonRoute({
				operationId: "checkHealth",
				summary: "Health Check",
				description: "Checks the health status of the application.",
				tags: ["Health"],
				responses: {
					[StatusCodes.OK]: null,
					[StatusCodes.SERVICE_UNAVAILABLE]: ErrorData,
				},
			}),
			async (c) => {
				try {
					await Database.ping();
					return c.body(null, StatusCodes.OK);
				} catch (error) {
					return c.json(ErrorData.parse({ error: String(error) }), StatusCodes.SERVICE_UNAVAILABLE);
				}
			},
		);
	}

	private authProviderCallback() {
		this.get(
			"/auth/callback",
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
			validator("query", z.object({ code: z.string(), state: z.string() })),
			async (c) => {
				const { code, state } = c.req.valid("query");

				const authResult = await c.var.app.authenticator.handleAuthCallback(code, state);

				const userData = await c.var.app.authenticator.handleAuthResult(authResult);

				await setSignedCookie(c, appConfig.userCookieName, userData.id, appConfig.userCookieSecret, {
					maxAge: appConfig.userCookieMaxAge,
				});

				return c.redirect(appConfig.homepageUrl);
			},
		);
	}

	private authProviderLogin() {
		this.get(
			"/auth/login",
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
			(c) => {
				return c.redirect(c.var.app.authenticator.getWebFlowAuthorizationUrl());
			},
		);
	}

	private getAuthenticatedUser() {
		this.get(
			"/auth/user",
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
				return c.json(user);
			},
		);
	}

	private logout() {
		this.get(
			"/auth/logout",
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
						description:
							"If the session is missing or invalid, the cookie is simply not present; redirect still occurs.",
					},
				},
			}),
			(c) => {
				return c.redirect(appConfig.homepageUrl ?? "http://localhost:3000");
			},
		);
	}
}
