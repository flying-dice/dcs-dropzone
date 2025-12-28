import { Hono } from "hono";
import { describeRoute, resolver } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";

export default (deps: { daemonInstanceId: string }) => {
	const router = new Hono();

	router.get(
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
				return c.json({ status: "UP", daemonInstanceId: deps.daemonInstanceId }, StatusCodes.OK);
			} catch (error) {
				return c.json(
					{ status: "DOWN", daemonInstanceId: deps.daemonInstanceId, error: String(error) },
					StatusCodes.SERVICE_UNAVAILABLE,
				);
			}
		},
	);

	return router;
};
