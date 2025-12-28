import { describeJsonRoute } from "@packages/hono/describeJsonRoute";
import { Hono } from "hono";
import { validator } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { ModAndReleaseData } from "../schemas/ModAndReleaseData";
import type { AddRelease } from "../services/AddRelease.ts";
import type { GetAllDaemonReleases } from "../services/GetAllDaemonReleases.ts";
import type { RemoveRelease } from "../services/RemoveRelease.ts";

export default (deps: {
	addRelease: AddRelease;
	removeRelease: RemoveRelease;
	getAllDaemonReleases: GetAllDaemonReleases;
}) => {
	const router = new Hono();

	router.post(
		"/api/downloads",
		describeJsonRoute({
			operationId: "addReleaseToDaemon",
			tags: ["Downloads"],
			responses: {
				[StatusCodes.OK]: null,
			},
		}),
		validator("json", ModAndReleaseData),

		(c) => {
			const modAndRelease = c.req.valid("json");

			deps.addRelease.execute(modAndRelease);

			return c.json(null, StatusCodes.OK);
		},
	);

	router.get(
		"/api/downloads",
		describeJsonRoute({
			operationId: "getAllDaemonReleases",
			tags: ["Downloads"],
			responses: {
				[StatusCodes.OK]: ModAndReleaseData.array(),
			},
		}),
		(c) => {
			const subscriptions = deps.getAllDaemonReleases.execute();

			return c.json(subscriptions, StatusCodes.OK);
		},
	);

	router.delete(
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
		),
		(c) => {
			const { releaseId } = c.req.valid("param");

			deps.removeRelease.execute(releaseId);

			return c.json(null, StatusCodes.OK);
		},
	);

	return router;
};
