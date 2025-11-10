import { Scalar } from "@scalar/hono-api-reference";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import { openAPIRouteHandler } from "hono-openapi";
import auth from "./api/auth.ts";
import health from "./api/health.ts";
import userMods from "./api/user-mods.ts";
import Logger from "./Logger.ts";
import { loggerMiddleware } from "./middleware/logger.ts";

export const application = new Hono();
application.use("/*", cors());

application.use(requestId());

application.use("*", loggerMiddleware(Logger.getLogger("hono")));
application.route("/auth", auth);
application.route("/api/health", health);
application.route("/api/user-mods", userMods);

application.get(
	"/v3/api-docs",
	openAPIRouteHandler(application, {
		documentation: {
			info: {
				title: "DCS Dropzone Registry API",
				version: "1.0.0",
				description: "API documentation for the DCS Dropzone Registry.",
			},
		},
	}),
);

application.get("/api", Scalar({ url: "/v3/api-docs" }));
