import "../mongo-db/Database.ts";
import { jsonErrorTransformer } from "@packages/hono/jsonErrorTransformer";
import { requestResponseLogger } from "@packages/hono/requestResponseLogger";
import { Scalar } from "@scalar/hono-api-reference";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import { openAPIRouteHandler } from "hono-openapi";
import appConfig from "../../ApplicationConfig.ts";
import auth from "../../api/auth.ts";
import categories from "../../api/categories.ts";
import featuredMods from "../../api/dashboard.ts";
import health from "../../api/health.ts";
import migrate from "../../api/migrate.ts";
import modReleases from "../../api/mod-releases.ts";
import mods from "../../api/mods.ts";
import tags from "../../api/tags.ts";
import userModReleases from "../../api/user-mod-releases.ts";
import userMods from "../../api/user-mods.ts";

export const hono = new Hono();
hono.use("/*", cors());

hono.use(requestId());

hono.use("*", requestResponseLogger);
hono.route("/auth", auth);
hono.route("/api/health", health);
hono.route("/api/user-mods", userMods);
hono.route("/api/user-mods", userModReleases);
hono.route("/api/mods", mods);
hono.route("/api/mods", modReleases);
hono.route("/", featuredMods);
hono.route("/api/categories", categories);
hono.route("/api/tags", tags);
hono.route("/api/_migrate", migrate);

hono.get(
	"/v3/api-docs",
	openAPIRouteHandler(hono, {
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

hono.get("/api", Scalar({ url: "/v3/api-docs" }));

hono.onError(jsonErrorTransformer);
