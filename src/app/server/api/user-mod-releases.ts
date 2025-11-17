import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import ApplicationContext from "../Application.ts";
import Logger from "../Logger.ts";
import { cookieAuth } from "../middleware/cookieAuth.ts";
import { ModReleaseCreateData } from "../schemas/ModReleaseCreateData.ts";
import { ModReleaseData } from "../schemas/ModReleaseData.ts";
import { ModReleaseServiceError } from "../services/ModReleaseService.ts";
import { describeJsonRoute } from "./describeJsonRoute.ts";

const router = new Hono();

const logger = Logger.getLogger("api/user-mod-releases");

/**
 * GET /api/user-mods/:id/releases - List all releases for a user-owned mod
 */
router.get(
	"/:id/releases",
	describeJsonRoute({
		operationId: "getUserModReleases",
		summary: "Get user mod releases",
		description:
			"Retrieves all releases for a specific mod owned by the authenticated user.",
		tags: ["User Mod Releases"],
		security: [{ cookieAuth: [] }],
		responses: {
			[StatusCodes.OK]: z.object({
				data: z.array(ModReleaseData),
			}),
			[StatusCodes.UNAUTHORIZED]: null,
		},
	}),
	cookieAuth(),
	validator("param", z.object({ id: z.string() })),
	async (c) => {
		const { id } = c.req.valid("param");
		const user = c.var.getUser();
		const service = ApplicationContext.getModReleaseService(user);

		logger.debug(`User '${user.id}' is requesting releases for mod '${id}'`);

		const result = await service.findUserModReleases(id);

		if (result === ModReleaseServiceError.ModNotFound) {
			throw new HTTPException(StatusCodes.NOT_FOUND);
		}

		return c.json({ data: result }, StatusCodes.OK);
	},
);

/**
 * GET /api/user-mods/:id/releases/:releaseId - Get a specific release for a user-owned mod
 */
router.get(
	"/:id/releases/:releaseId",
	describeJsonRoute({
		operationId: "getUserModReleaseById",
		summary: "Get user mod release by ID",
		description: "Retrieves a specific release for a user-owned mod by its ID.",
		tags: ["User Mod Releases"],
		security: [{ cookieAuth: [] }],
		responses: {
			[StatusCodes.OK]: ModReleaseData,
			[StatusCodes.NOT_FOUND]: null,
			[StatusCodes.UNAUTHORIZED]: null,
		},
	}),
	cookieAuth(),
	validator(
		"param",
		z.object({
			id: z.string(),
			releaseId: z.string(),
		}),
	),
	async (c) => {
		const { id, releaseId } = c.req.valid("param");
		const user = c.var.getUser();
		const service = ApplicationContext.getModReleaseService(user);

		logger.debug(
			`User '${user.id}' is requesting release '${releaseId}' for mod '${id}'`,
		);

		const result = await service.findUserModReleaseById(id, releaseId);

		if (result === ModReleaseServiceError.NotFound) {
			throw new HTTPException(StatusCodes.NOT_FOUND);
		}

		return c.json(result, StatusCodes.OK);
	},
);

/**
 * POST /api/user-mods/:id/releases - Create a new release for a user-owned mod
 */
router.post(
    "/:id/releases",
    describeJsonRoute({
        operationId: "createUserModRelease",
        summary: "Create user mod release",
        description:
            "Creates a new release for a mod owned by the authenticated user.",
        tags: ["User Mod Releases"],
        security: [{ cookieAuth: [] }],
        responses: {
            [StatusCodes.CREATED]: ModReleaseData,
            [StatusCodes.UNAUTHORIZED]: null,
            [StatusCodes.NOT_FOUND]: null,
        },
    }),
	cookieAuth(),
	validator("param", z.object({ id: z.string() })),
	validator("json", ModReleaseCreateData),
	async (c) => {
		const { id } = c.req.valid("param");
		const createRequest = c.req.valid("json");
		const user = c.var.getUser();
		const service = ApplicationContext.getModReleaseService(user);

		logger.debug(`User '${user.id}' is creating a new release for mod '${id}'`);

		const result = await service.createRelease(id, createRequest);

		if (result === ModReleaseServiceError.ModNotFound) {
			throw new HTTPException(StatusCodes.NOT_FOUND);
		}

		return c.json(result, StatusCodes.CREATED);
	},
);

/**
 * PUT /api/user-mods/:id/releases/:releaseId - Update an existing release
 */
router.put(
    "/:id/releases/:releaseId",
    describeJsonRoute({
        operationId: "updateUserModRelease",
        summary: "Update user mod release",
        description:
            "Updates fields of an existing release for a mod owned by the authenticated user.",
        tags: ["User Mod Releases"],
        security: [{ cookieAuth: [] }],
        responses: {
            [StatusCodes.OK]: null,
            [StatusCodes.NOT_FOUND]: null,
            [StatusCodes.UNAUTHORIZED]: null,
        },
    }),
	cookieAuth(),
	validator(
		"param",
		z.object({
			id: z.string(),
			releaseId: z.string(),
		}),
	),
	validator("json", ModReleaseData.omit({ id: true, mod_id: true })),
	async (c) => {
		const { id, releaseId } = c.req.valid("param");
		const updates = c.req.valid("json");
		const user = c.var.getUser();
		const service = ApplicationContext.getModReleaseService(user);

		logger.debug(
			`User '${user.id}' is updating release '${releaseId}' for mod '${id}'`,
		);

		const result = await service.updateRelease({
			id: releaseId,
			mod_id: id,
			...updates,
		});

		if (result === ModReleaseServiceError.NotFound) {
			throw new HTTPException(StatusCodes.NOT_FOUND);
		}

		return c.body(null, StatusCodes.OK);
	},
);

/**
 * DELETE /api/user-mods/:id/releases/:releaseId - Delete a release
 */
router.delete(
    "/:id/releases/:releaseId",
    describeJsonRoute({
        operationId: "deleteUserModRelease",
        summary: "Delete user mod release",
        description:
            "Deletes an existing release for a mod owned by the authenticated user.",
        tags: ["User Mod Releases"],
        security: [{ cookieAuth: [] }],
        responses: {
            [StatusCodes.OK]: null,
            [StatusCodes.NOT_FOUND]: null,
            [StatusCodes.UNAUTHORIZED]: null,
        },
    }),
	cookieAuth(),
	validator(
		"param",
		z.object({
			id: z.string(),
			releaseId: z.string(),
		}),
	),
	async (c) => {
		const { id, releaseId } = c.req.valid("param");
		const user = c.var.getUser();
		const service = ApplicationContext.getModReleaseService(user);

		logger.debug(
			`User '${user.id}' is deleting release '${releaseId}' for mod '${id}'`,
		);

		const result = await service.deleteRelease(id, releaseId);

		if (result === ModReleaseServiceError.NotFound) {
			throw new HTTPException(StatusCodes.NOT_FOUND);
		}

		return c.body(null, StatusCodes.OK);
	},
);

export default router;
