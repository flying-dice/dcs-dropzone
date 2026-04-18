import { describeRoute, resolver } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { getLogger } from "log4js";
import { z } from "zod";
import ApplicationFactory from "../hono/ApplicationFactory.ts";

const logger = getLogger("GetDaemonHealth");

export const GetDaemonHealth = ApplicationFactory.createHandlers(
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
		logger.info("Performing health check");
		try {
			logger.info("Health check passed - status UP");
			return c.json({ status: "UP", daemonInstanceId: c.var.app.getDaemonInstanceId() }, StatusCodes.OK);
		} catch (error) {
			logger.error("Health check failed:", error);
			return c.json(
				{ status: "DOWN", daemonInstanceId: c.var.app.getDaemonInstanceId(), error: String(error) },
				StatusCodes.SERVICE_UNAVAILABLE,
			);
		}
	},
);
