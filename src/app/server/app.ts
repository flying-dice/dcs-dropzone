import { Scalar } from "@scalar/hono-api-reference";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import { openAPIRouteHandler } from "hono-openapi";
import auth from "./api/auth.ts";
import health from "./api/health.ts";
import mods from "./api/mods.ts";
import { getLogger } from "./logger.ts";
import { loggerMiddleware } from "./middleware/logger.ts";

export const app = new Hono();
app.use("/*", cors());

app.use(requestId());

app.use("*", loggerMiddleware(getLogger("hono")));
app.route("/auth", auth);
app.route("/api/health", health);
app.route("/api/mods", mods);

app.get(
	"/v3/api-docs",
	openAPIRouteHandler(app, {
		documentation: {
			info: {
				title: "DCS Dropzone Registry API",
				version: "1.0.0",
				description: "API documentation for the DCS Dropzone Registry.",
			},
		},
	}),
);

app.get("/api", Scalar({ url: "/v3/api-docs" }));
