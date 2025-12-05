import { Scalar } from "@scalar/hono-api-reference";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { requestId } from "hono/request-id";
import { openAPIRouteHandler } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { getLogger } from "log4js";
import { ErrorData } from "../app/server/schemas/ErrorData.ts";
import downloads from "./api/downloads.ts";
import health from "./api/health.ts";
import toggle from "./api/toggle.ts";
import { type AppContext, appContextMiddleware } from "./middleware/appContext.ts";
import { requestResponseLogger } from "./middleware/requestResponseLogger.ts";

const logger = getLogger("Server");

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

	server.onError((error, c) => {
		logger.error(error);
		if (error instanceof HTTPException) {
			return c.json(
				ErrorData.parse(<ErrorData>{
					code: error.status,
					error: error.message,
				}),
				error.status,
			);
		}

		return c.json(
			ErrorData.parse(<ErrorData>{
				code: StatusCodes.INTERNAL_SERVER_ERROR,
				error: error.message,
			}),
			StatusCodes.INTERNAL_SERVER_ERROR,
		);
	});

	return server;
}
