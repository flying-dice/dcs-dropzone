import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { getLogger } from "log4js";
import { z } from "zod";
import { describeJsonRoute } from "../../../common/describeJsonRoute.ts";
import findPublicModReleaseById from "../queries/find-public-mod-release-by-id.ts";
import findPublicModReleases from "../queries/find-public-mod-releases.ts";
import { ModReleaseData } from "../schemas/ModReleaseData.ts";

const router = new Hono();

const logger = getLogger("api/mod-releases");

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

		const releases = await findPublicModReleases({ modId: id }, {});

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

		const result = await findPublicModReleaseById(
			{ modId: id, releaseId },
			{},
		);

		if (!result) {
			throw new HTTPException(StatusCodes.NOT_FOUND);
		}

		return c.json(result, StatusCodes.OK);
	},
);

export default router;
