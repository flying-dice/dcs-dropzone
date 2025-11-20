import "./Database.ts";
import { Scalar } from "@scalar/hono-api-reference";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import { openAPIRouteHandler } from "hono-openapi";
import appConfig from "./ApplicationConfig.ts";
import auth from "./api/auth.ts";
import health from "./api/health.ts";
import migrate from "./api/migrate.ts";
import modReleases from "./api/mod-releases.ts";
import mods from "./api/mods.ts";
import userModReleases from "./api/user-mod-releases.ts";
import userMods from "./api/user-mods.ts";
import { requestResponseLogger } from "./middleware/requestResponseLogger.ts";

export const server = new Hono();
server.use("/*", cors());

server.use(requestId());

server.use("*", requestResponseLogger());
server.route("/auth", auth);
server.route("/api/health", health);
server.route("/api/user-mods", userMods);
server.route("/api/user-mods", userModReleases);
server.route("/api/mods", mods);
server.route("/api/mods", modReleases);
server.route("/api/_migrate", migrate);

server.get(
	"/v3/api-docs",
	openAPIRouteHandler(server, {
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
						description:
							"Session cookie used for authenticating user endpoints. Set after successful OAuth login.",
					},
				},
			},
		},
	}),
);

server.get("/api", Scalar({ url: "/v3/api-docs" }));
