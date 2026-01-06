import "../mongo-db";
import { jsonErrorTransformer } from "@packages/hono/jsonErrorTransformer";
import { requestResponseLogger } from "@packages/hono/requestResponseLogger";
import { Scalar } from "@scalar/hono-api-reference";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import { openAPIRouteHandler } from "hono-openapi";
import appConfig from "../ApplicationConfig.ts";
import auth from "./routes/auth.ts";
import categories from "./routes/categories.ts";
import featuredMods from "./routes/dashboard.ts";
import health from "./routes/health.ts";
import migrate from "./routes/migrate.ts";
import modReleases from "./routes/mod-releases.ts";
import mods from "./routes/mods.ts";
import tags from "./routes/tags.ts";
import userModReleases from "./routes/user-mod-releases.ts";
import userMods from "./routes/user-mods.ts";

export class HonoApplication extends Hono {
	constructor() {
		super();

		this.use("/*", cors());

		this.use(requestId());

		this.use("*", requestResponseLogger);
		this.route("/auth", auth);
		this.route("/api/health", health);
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
}
