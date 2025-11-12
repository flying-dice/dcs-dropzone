import "./Database.ts";
import { Scalar } from "@scalar/hono-api-reference";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import { openAPIRouteHandler } from "hono-openapi";
import auth from "./api/auth.ts";
import health from "./api/health.ts";
import mods from "./api/mods.ts";
import userMods from "./api/user-mods.ts";
import { requestResponseLogger } from "./middleware/requestResponseLogger.ts";

export const server = new Hono();
server.use("/*", cors());

server.use(requestId());

server.use("*", requestResponseLogger());
server.route("/auth", auth);
server.route("/api/health", health);
server.route("/api/user-mods", userMods);
server.route("/api/mods", mods);

server.get(
	"/v3/api-docs",
	openAPIRouteHandler(server, {
		documentation: {
			info: {
				title: "DCS Dropzone Registry API",
				version: "1.0.0",
				description: "API documentation for the DCS Dropzone Registry.",
			},
		},
	}),
);

server.get("/api", Scalar({ url: "/v3/api-docs" }));
