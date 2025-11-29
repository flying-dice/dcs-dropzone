import { Scalar } from "@scalar/hono-api-reference";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import { openAPIRouteHandler } from "hono-openapi";
import health from "./api/health.ts";
import {
	createSubscriptionsRouter,
	type SubscriptionsRouterDependencies,
} from "./api/subscriptions.ts";
import { requestResponseLogger } from "./middleware/requestResponseLogger.ts";

export type ServerDependencies = SubscriptionsRouterDependencies;

export function createServer(deps: ServerDependencies): Hono {
	const server = new Hono();
	server.use("/*", cors());

	server.use(requestId());

	server.use("*", requestResponseLogger());
	server.route("/api/health", health);

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

	const subscriptions = createSubscriptionsRouter(deps);
	server.route("/api/subscriptions", subscriptions);

	return server;
}
