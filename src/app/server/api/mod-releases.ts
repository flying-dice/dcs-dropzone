import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import ApplicationContext from "../Application.ts";
import Logger from "../Logger.ts";
import { ModReleaseData } from "../schemas/ModReleaseData.ts";
import { ModReleaseServiceError } from "../services/ModReleaseService.ts";
import { describeJsonRoute } from "../../../common/describeJsonRoute.ts";

const router = new Hono();

const logger = Logger.getLogger("api/mod-releases");

/**
 * GET /api/mods/:id/releases - List all public releases for a mod
 */
router.get(
	"/:id/releases",
	describeJsonRoute({
		operationId: "getModReleases",
		summary: "Get mod releases",
		description: "Retrieves all public releases for a specific mod.",
		tags: ["Mod Releases"],
		responses: {
			[StatusCodes.OK]: z.object({
				data: z.array(ModReleaseData),
			}),
		},
	}),
	validator("param", z.object({ id: z.string() })),
	async (c) => {
		const { id } = c.req.valid("param");

		logger.debug(`Fetching public releases for mod '${id}'`);

		const releases =
			await ApplicationContext.publicModReleaseService.findPublicModReleases(
				id,
			);

		return c.json({ data: releases }, StatusCodes.OK);
	},
);

/**
 * GET /api/mods/:id/releases/:releaseId - Get a specific public release
 */
router.get(
	"/:id/releases/:releaseId",
	describeJsonRoute({
		operationId: "getModReleaseById",
		summary: "Get mod release by ID",
		description: "Retrieves a specific public release for a mod by its ID.",
		tags: ["Mod Releases"],
		responses: {
			[StatusCodes.OK]: ModReleaseData,
			[StatusCodes.NOT_FOUND]: null,
		},
	}),
	validator(
		"param",
		z.object({
			id: z.string(),
			releaseId: z.string(),
		}),
	),
	async (c) => {
		const { id, releaseId } = c.req.valid("param");

		logger.debug(`Fetching public release '${releaseId}' for mod '${id}'`);

		const result =
			await ApplicationContext.publicModReleaseService.findPublicModReleaseById(
				id,
				releaseId,
			);

		if (result === ModReleaseServiceError.NOT_FOUND) {
			throw new HTTPException(StatusCodes.NOT_FOUND);
		}

		return c.json(result, StatusCodes.OK);
	},
);

export default router;
