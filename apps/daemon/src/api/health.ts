import { Hono } from "hono";
import { describeRoute, resolver } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import type { AppContext } from "../middleware/appContext.ts";

const router = new Hono<AppContext>();

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
			return c.json({ status: "UP", daemonInstanceId: c.var.daemonInstanceId }, StatusCodes.OK);
		} catch (error) {
			return c.json(
				{ status: "DOWN", daemonInstanceId: c.var.daemonInstanceId, error: String(error) },
				StatusCodes.SERVICE_UNAVAILABLE,
			);
		}
	},
);

export default router;
