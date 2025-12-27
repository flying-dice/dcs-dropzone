import { Hono } from "hono";
import { describeRoute, resolver } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import Application from "../Application.ts";

const router = new Hono();

router.get(
	"/",
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
		try {
			return c.json({ status: "UP", daemonInstanceId: Application.daemonInstanceId }, StatusCodes.OK);
		} catch (error) {
			return c.json(
				{ status: "DOWN", daemonInstanceId: Application.daemonInstanceId, error: String(error) },
				StatusCodes.SERVICE_UNAVAILABLE,
			);
		}
	},
);

export default router;
