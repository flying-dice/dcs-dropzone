import { Hono } from "hono";
import { describeRoute, resolver } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { db } from "../database";

const router = new Hono();

router.get(
    "/",
    describeRoute({
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
			db.run("SELECT 1");
			return c.json({ status: "UP" }, StatusCodes.OK);
		} catch (error) {
			return c.json(
				{ status: "DOWN", error: String(error) },
				StatusCodes.SERVICE_UNAVAILABLE,
			);
		}
	},
);

export default router;
