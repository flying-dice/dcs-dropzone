import { describeJsonRoute } from "@packages/hono/describeJsonRoute";
import { getLoggingHook } from "@packages/hono/getLoggingHook";
import { jsonErrorTransformer } from "@packages/hono/jsonErrorTransformer";
import { requestResponseLogger } from "@packages/hono/requestResponseLogger";
import { ErrorData, OkData } from "@packages/hono/schemas";
import { Scalar } from "@scalar/hono-api-reference";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import { describeRoute, openAPIRouteHandler, resolver, validator } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { getLogger } from "log4js";
import { z } from "zod";
import { version } from "../../package.json";
import type { Application } from "../application/Application.ts";
import { ModAndReleaseData } from "../application/schemas/ModAndReleaseData.ts";

const logger = getLogger("HonoApplication");
const loggingHook = getLoggingHook(logger);

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

		this.addReleaseToDaemon();
		this.getAllDaemonReleases();
		this.removeReleaseFromDaemon();
		this.getDaemonHealth();
		this.enableRelease();
		this.disableRelease();

		this.getApiDocs();
		this.getScalarUi();

		this.onError(jsonErrorTransformer);
	}

	private getScalarUi() {
		this.get("/api", Scalar({ url: "/v3/api-docs" }));
	}

	private getApiDocs() {
		this.get(
			"/v3/api-docs",
			openAPIRouteHandler(this, {
				documentation: {
					info: {
						title: "DCS Dropzone Daemon API",
						version: "1.0.0",
						description: "API documentation for the DCS Dropzone Daemon.",
					},
				},
			}),
		);
	}

	private addReleaseToDaemon() {
		this.post(
			"/api/downloads",
			describeJsonRoute({
				operationId: "addReleaseToDaemon",
				tags: ["Downloads"],
				responses: {
					[StatusCodes.OK]: null,
				},
			}),
			validator("json", ModAndReleaseData, loggingHook),

			(c) => {
				const modAndRelease = c.req.valid("json");

				c.var.app.addRelease(modAndRelease);

				return c.json(null, StatusCodes.OK);
			},
		);
	}

	private getAllDaemonReleases() {
		this.get(
			"/api/downloads",
			describeJsonRoute({
				operationId: "getAllDaemonReleases",
				tags: ["Downloads"],
				responses: {
					[StatusCodes.OK]: ModAndReleaseData.array(),
				},
			}),
			(c) => {
				const subscriptions = c.var.app.getAllReleasesWithStatus();

				return c.json(subscriptions, StatusCodes.OK);
			},
		);
	}

	private removeReleaseFromDaemon() {
		this.delete(
			"/api/downloads/:releaseId",
			describeJsonRoute({
				operationId: "removeReleaseFromDaemon",
				tags: ["Downloads"],
				responses: {
					[StatusCodes.OK]: null,
				},
			}),
			validator(
				"param",
				z.object({
					releaseId: z.string(),
				}),
				loggingHook,
			),
			(c) => {
				const { releaseId } = c.req.valid("param");

				c.var.app.removeRelease(releaseId);

				return c.json(null, StatusCodes.OK);
			},
		);
	}

	private getDaemonHealth() {
		this.get(
			"/api/health",
			describeRoute({
				operationId: "getDaemonHealth",
				tags: ["Health"],
				summary: "Daemon health check",
				description: "Checks the daemon service health by performing a lightweight database operation.",
				responses: {
					[StatusCodes.OK]: {
						description: "Service is healthy",
						content: {
							"application/json": {
								schema: resolver(
									z.object({
										status: z.literal("UP"),
										daemonInstanceId: z.string(),
										version: z.string(),
									}),
								),
							},
						},
					},
					[StatusCodes.SERVICE_UNAVAILABLE]: {
						description: "Service is unavailable",
						content: {
							"application/json": {
								schema: resolver(
									z.object({
										status: z.literal("DOWN"),
										daemonInstanceId: z.string(),
										error: z.string(),
									}),
								),
							},
						},
					},
				},
			}),
			async (c) => {
				try {
					return c.json({ status: "UP", daemonInstanceId: c.var.app.getDaemonInstanceId(), version }, StatusCodes.OK);
				} catch (error) {
					return c.json(
						{ status: "DOWN", daemonInstanceId: c.var.app.getDaemonInstanceId(), error: String(error) },
						StatusCodes.SERVICE_UNAVAILABLE,
					);
				}
			},
		);
	}

	private enableRelease() {
		this.post(
			"/api/toggle/:releaseId/enable",
			describeJsonRoute({
				operationId: "enableRelease",
				tags: ["Toggle"],
				summary: "Enable a release by creating its symbolic links",
				responses: { [StatusCodes.OK]: OkData, [StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData },
			}),
			validator("param", z.object({ releaseId: z.string() }), loggingHook),
			async (c) => {
				const { releaseId } = c.req.valid("param");
				c.var.app.enableRelease(releaseId);
				return c.json(OkData.parse({ ok: true }), StatusCodes.OK);
			},
		);
	}

	private disableRelease() {
		this.post(
			"/api/toggle/:releaseId/disable",
			describeJsonRoute({
				operationId: "disableRelease",
				tags: ["Toggle"],
				summary: "Disable a release by removing its symbolic links",
				responses: { [StatusCodes.OK]: OkData, [StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData },
			}),
			validator("param", z.object({ releaseId: z.string() }), loggingHook),
			async (c) => {
				const { releaseId } = c.req.valid("param");
				c.var.app.disableRelease(releaseId);
				return c.json(OkData.parse({ ok: true }), StatusCodes.OK);
			},
		);
	}
}
