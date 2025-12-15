import { describeJsonRoute } from "@packages/hono/describeJsonRoute";
import { Hono } from "hono";
import { validator } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { getLogger } from "log4js";
import { z } from "zod";
import createRelease from "../commands/CreateRelease.ts";
import deleteRelease from "../commands/DeleteRelease.ts";
import markReleaseAsLatest from "../commands/MarkReleaseAsLatest.ts";
import updateRelease from "../commands/UpdateRelease.ts";
import { cookieAuth } from "../middleware/cookieAuth.ts";
import findUserModReleaseById from "../queries/FindUserModReleaseById.ts";
import findUserModReleases from "../queries/FindUserModReleases.ts";
import { ErrorData } from "../schemas/ErrorData.ts";
import { ModReleaseCreateData } from "../schemas/ModReleaseCreateData.ts";
import { ModReleaseData } from "../schemas/ModReleaseData.ts";
import { OkData } from "../schemas/OkData.ts";

const router = new Hono();

const logger = getLogger("api/user-mod-releases");

/**
 * GET /api/user-mods/:id/releases - List all releases for a user-owned mod
 */
router.get(
	"/:id/releases",
	describeJsonRoute({
		operationId: "getUserModReleases",
		summary: "Get user mod releases",
		description: "Retrieves all releases for a specific mod owned by the authenticated user.",
		tags: ["User Mod Releases"],
		security: [{ cookieAuth: [] }],
		responses: {
			[StatusCodes.OK]: z.object({
				data: ModReleaseData.array(),
			}),
			[StatusCodes.NOT_FOUND]: ErrorData,
			[StatusCodes.UNAUTHORIZED]: ErrorData,
			[StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData,
		},
	}),
	cookieAuth(),
	validator("param", z.object({ id: z.string() })),
	async (c) => {
		const { id } = c.req.valid("param");
		const user = c.var.getUser();

		logger.debug(`User '${user.id}' is requesting releases for mod '${id}'`);

		const result = await findUserModReleases({
			user,
			modId: id,
		});

		return result.match(
			(data) => c.json({ data }, StatusCodes.OK),
			(error) =>
				c.json(
					ErrorData.parse({
						code: StatusCodes.NOT_FOUND,
						error,
					}),
					StatusCodes.NOT_FOUND,
				),
		);
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
			[StatusCodes.NOT_FOUND]: ErrorData,
			[StatusCodes.UNAUTHORIZED]: ErrorData,
			[StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData,
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

		logger.debug(`User '${user.id}' is requesting release '${releaseId}' for mod '${id}'`);

		const result = await findUserModReleaseById({
			user,
			modId: id,
			releaseId,
		});

		return result.match(
			(body) => c.json(body, StatusCodes.OK),
			(error) =>
				c.json(
					ErrorData.parse({
						code: StatusCodes.NOT_FOUND,
						error,
					}),
					StatusCodes.NOT_FOUND,
				),
		);
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
		description: "Creates a new release for a mod owned by the authenticated user.",
		tags: ["User Mod Releases"],
		security: [{ cookieAuth: [] }],
		responses: {
			[StatusCodes.CREATED]: ModReleaseData,
			[StatusCodes.NOT_FOUND]: ErrorData,
			[StatusCodes.UNAUTHORIZED]: ErrorData,
			[StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData,
		},
	}),
	cookieAuth(),
	validator("param", z.object({ id: z.string() })),
	validator("json", ModReleaseCreateData),
	async (c) => {
		const { id } = c.req.valid("param");
		const createData = c.req.valid("json");
		const user = c.var.getUser();

		logger.debug(`User '${user.id}' is creating a new release for mod '${id}'`);

		const result = await createRelease({
			modId: id,
			createData,
			user,
		});

		return result.match(
			(body) => c.json(body, StatusCodes.CREATED),
			(error) =>
				c.json(
					ErrorData.parse({
						code: StatusCodes.NOT_FOUND,
						error,
					}),
					StatusCodes.NOT_FOUND,
				),
		);
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
		description: "Updates fields of an existing release for a mod owned by the authenticated user.",
		tags: ["User Mod Releases"],
		security: [{ cookieAuth: [] }],
		responses: {
			[StatusCodes.OK]: OkData,
			[StatusCodes.NOT_FOUND]: ErrorData,
			[StatusCodes.UNAUTHORIZED]: ErrorData,
			[StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData,
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

		logger.debug(`User '${user.id}' is updating release '${releaseId}' for mod '${id}'`);

		const result = await updateRelease({
			user,
			updateData: {
				id: releaseId,
				mod_id: id,
				...updates,
			},
		});

		return result.match(
			() =>
				c.json(
					OkData.parse({
						ok: true,
					}),
					StatusCodes.OK,
				),
			(error) =>
				c.json(
					{
						code: StatusCodes.NOT_FOUND,
						error,
					},
					StatusCodes.NOT_FOUND,
				),
		);
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
		description: "Deletes an existing release for a mod owned by the authenticated user.",
		tags: ["User Mod Releases"],
		security: [{ cookieAuth: [] }],
		responses: {
			[StatusCodes.OK]: OkData,
			[StatusCodes.NOT_FOUND]: ErrorData,
			[StatusCodes.UNAUTHORIZED]: ErrorData,
			[StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData,
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

		logger.debug(`User '${user.id}' is deleting release '${releaseId}' for mod '${id}'`);

		const result = await deleteRelease({
			user,
			modId: id,
			releaseId,
		});

		return result.match(
			() =>
				c.json(
					OkData.parse({
						ok: true,
					}),
					StatusCodes.OK,
				),
			(error) =>
				c.json(
					ErrorData.parse({
						code: StatusCodes.NOT_FOUND,
						error,
					}),
					StatusCodes.NOT_FOUND,
				),
		);
	},
);

/**
 * POST /api/user-mods/:id/releases/:releaseId/mark-latest - Mark a release as latest
 */
router.post(
	"/:id/releases/:releaseId/mark-latest",
	describeJsonRoute({
		operationId: "markUserModReleaseAsLatest",
		summary: "Mark user mod release as latest",
		description: "Marks a specific release as the latest for a mod owned by the authenticated user. This will unmark any other releases that were previously marked as latest.",
		tags: ["User Mod Releases"],
		security: [{ cookieAuth: [] }],
		responses: {
			[StatusCodes.OK]: OkData,
			[StatusCodes.NOT_FOUND]: ErrorData,
			[StatusCodes.UNAUTHORIZED]: ErrorData,
			[StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData,
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

		logger.debug(`User '${user.id}' is marking release '${releaseId}' as latest for mod '${id}'`);

		const result = await markReleaseAsLatest({
			user,
			modId: id,
			releaseId,
		});

		return result.match(
			() =>
				c.json(
					OkData.parse({
						ok: true,
					}),
					StatusCodes.OK,
				),
			(error) =>
				c.json(
					ErrorData.parse({
						code: StatusCodes.NOT_FOUND,
						error,
					}),
					StatusCodes.NOT_FOUND,
				),
		);
	},
);

export default router;
