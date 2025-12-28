import { describeJsonRoute } from "@packages/hono/describeJsonRoute";
import { Hono } from "hono";
import { validator } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { ErrorData } from "../schemas/ErrorData.ts";
import { OkData } from "../schemas/OkData.ts";
import type { DisableRelease } from "../services/DisableRelease.ts";
import type { EnableRelease } from "../services/EnableRelease.ts";

export default (deps: { enableRelease: EnableRelease; disableRelease: DisableRelease }) => {
	const router = new Hono();

	router.post(
		"/api/toggle/:releaseId/enable",
		describeJsonRoute({
			operationId: "enableRelease",
			tags: ["Toggle"],
			summary: "Enable a release by creating its symbolic links",
			responses: { [StatusCodes.OK]: OkData, [StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData },
		}),
		validator("param", z.object({ releaseId: z.string() })),
		async (c) => {
			const { releaseId } = c.req.valid("param");
			deps.enableRelease.execute(releaseId);
			return c.json(OkData.parse({ ok: true }), StatusCodes.OK);
		},
	);

	router.post(
		"/api/toggle/:releaseId/disable",
		describeJsonRoute({
			operationId: "disableRelease",
			tags: ["Toggle"],
			summary: "Disable a release by removing its symbolic links",
			responses: { [StatusCodes.OK]: OkData, [StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData },
		}),
		validator("param", z.object({ releaseId: z.string() })),
		async (c) => {
			const { releaseId } = c.req.valid("param");
			deps.disableRelease.execute(releaseId);
			return c.json(OkData.parse({ ok: true }), StatusCodes.OK);
		},
	);

	return router;
};
