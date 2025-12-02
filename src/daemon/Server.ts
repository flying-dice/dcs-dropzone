import { Scalar } from "@scalar/hono-api-reference";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import { openAPIRouteHandler } from "hono-openapi";
import downloads from "./api/downloads.ts";
import health from "./api/health.ts";
import toggle from "./api/toggle.ts";
import { type AppContext, appContextMiddleware } from "./middleware/appContext.ts";
import { requestResponseLogger } from "./middleware/requestResponseLogger.ts";

export function createServer(deps: AppContext["Variables"]): Hono<AppContext> {
	const server = new Hono<AppContext>();
	server.use("/*", cors());

	server.use(requestId());

	server.use("*", requestResponseLogger());
	server.use("*", appContextMiddleware(deps));

	server.route("/api/health", health);

	server.get(
		"/v3/api-docs",
		openAPIRouteHandler(server, {
			documentation: {
				info: {
					title: "DCS Dropzone Daemon API",
					version: "1.0.0",
					description: "API documentation for the DCS Dropzone Daemon.",
				},
			},
		}),
	);

	server.get("/api", Scalar({ url: "/v3/api-docs" }));

	server.route("/api/downloads", downloads);
	server.route("/api/toggle", toggle);

	return server;
}
