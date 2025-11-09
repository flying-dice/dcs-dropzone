import { Hono } from "hono";
import { describeRoute, resolver, validator } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { ModDtoSchema } from "../dto/ModDto.ts";
import { getLogger } from "../logger.ts";
import { cookieAuth } from "../middleware/cookieAuth.ts";
import { getUserModService } from "../services";
import { UserModServiceError } from "../services/UserModService.ts";

const router = new Hono();

const logger = getLogger("api/user-mods");

/**
 * GET /api/user-mods - List all user's mods (summary view)
 */
router.get(
	"/",
	describeRoute({
		operationId: "getUserMods",
		summary: "List all user's mods",
		description:
			"Get a list of all mods where the authenticated user is in the maintainers list (without content and versions)",
		tags: ["User Mods"],
		security: [{ cookieAuth: [] }],
		responses: {
			[StatusCodes.OK]: {
				description: "List of user's mods",
				content: {
					"application/json": {
						schema: resolver(z.array(ModDtoSchema)),
					},
				},
			},
			[StatusCodes.UNAUTHORIZED]: {
				description: "Authentication required",
			},
		},
	}),
	cookieAuth(),
	async (c) => {
		const user = c.var.getUser();
		const service = getUserModService(user);

		const mods = await service.findAllUserMods();

		return c.json(ModDtoSchema.array().parse(mods), StatusCodes.OK);
	},
);

/**
 * GET /api/user-mods/:id - Get a specific user mod by ID
 */
router.get(
	"/:id",
	describeRoute({
		operationId: "getUserModById",
		summary: "Get user mod by ID",
		description:
			"Get detailed information about a specific mod where the user is a maintainer, including content and versions",
		tags: ["User Mods"],
		security: [{ cookieAuth: [] }],
		responses: {
			[StatusCodes.OK]: {
				description: "Mod details",
				content: {
					"application/json": {
						schema: resolver(ModDtoSchema),
					},
				},
			},
			[StatusCodes.NOT_FOUND]: {
				description: "Mod not found",
			},
			[StatusCodes.FORBIDDEN]: {
				description: "User is not a maintainer of this mod",
			},
			[StatusCodes.UNAUTHORIZED]: {
				description: "Authentication required",
			},
		},
	}),
	cookieAuth(),
	validator("param", z.object({ id: z.string() })),
	async (c) => {
		const { id } = c.req.valid("param");
		const user = c.var.getUser();
		const service = getUserModService(user);

		const result = await service.findUserModById(id);

		if (result === UserModServiceError.NotMaintainer) {
			logger.warn(
				`User '${user.id}' attempted to access mod '${id}' which they do not maintain`,
			);
			return c.body(null, StatusCodes.NOT_FOUND);
		}

		if (result === UserModServiceError.NotFound) {
			return c.body(null, StatusCodes.NOT_FOUND);
		}

		return c.json(ModDtoSchema.parse(result), StatusCodes.OK);
	},
);

/**
 * POST /api/user-mods - Create a new mod
 */
router.post(
	"/",
	describeRoute({
		operationId: "createUserMod",
		summary: "Create a new mod",
		description:
			"Create a new mod. Requires authentication. The authenticated user will be added as a maintainer.",
		tags: ["User Mods"],
		security: [{ cookieAuth: [] }],
		responses: {
			[StatusCodes.CREATED]: {
				description: "Mod created successfully",
			},
			[StatusCodes.INTERNAL_SERVER_ERROR]: {
				description: "Failed to create mod",
				content: {
					"application/json": {
						schema: resolver(
							z.object({
								error: z.string(),
							}),
						),
					},
				},
			},
			[StatusCodes.UNAUTHORIZED]: {
				description: "Authentication required",
			},
		},
	}),
	cookieAuth(),
	validator("json", ModDtoSchema.pick({ name: true })),
	async (c) => {
		const createRequest = c.req.valid("json");
		const user = c.var.getUser();
		const service = getUserModService(user);

		await service.createMod(createRequest.name);

		return c.body(null, StatusCodes.CREATED);
	},
);

/**
 * PUT /api/user-mods/:id - Update an existing mod
 */
router.put(
	"/:id",
	describeRoute({
		operationId: "updateUserMod",
		summary: "Update a mod",
		description:
			"Update an existing mod. Requires authentication and user must be a maintainer.",
		tags: ["User Mods"],
		security: [{ cookieAuth: [] }],
		responses: {
			[StatusCodes.OK]: {
				description: "Mod updated successfully",
			},
			[StatusCodes.NOT_FOUND]: {
				description: "Mod not found",
				content: {
					"application/json": {
						schema: resolver(
							z.object({
								error: z.string(),
							}),
						),
					},
				},
			},
			[StatusCodes.UNAUTHORIZED]: {
				description: "Authentication required",
			},
		},
	}),
	cookieAuth(),
	validator("param", z.object({ id: z.string() })),
	validator("json", ModDtoSchema.omit({ id: true })),
	async (c) => {
		const { id } = c.req.valid("param");
		const updates = c.req.valid("json");
		const user = c.var.getUser();
		const service = getUserModService(user);

		const result = await service.updateMod({
			id,
			...updates,
		});

		if (result === UserModServiceError.NotFound) {
			return c.json(
				{ error: `Mod with id '${id}' not found` },
				StatusCodes.NOT_FOUND,
			);
		}

		if (result === UserModServiceError.NotMaintainer) {
			logger.warn(
				`User '${user.id}' attempted to update mod '${id}' which they do not maintain`,
			);
			return c.json(
				{ error: `Mod with id '${id}' not found` },
				StatusCodes.NOT_FOUND,
			);
		}

		return c.body(null, StatusCodes.OK);
	},
);

/**
 * DELETE /api/user-mods/:id - Delete a mod
 */
router.delete(
	"/:id",
	describeRoute({
		operationId: "deleteUserMod",
		summary: "Delete a mod",
		description:
			"Delete an existing mod. Requires authentication and user must be a maintainer.",
		tags: ["User Mods"],
		security: [{ cookieAuth: [] }],
		responses: {
			[StatusCodes.OK]: {
				description: "Mod deleted successfully",
			},
			[StatusCodes.NOT_FOUND]: {
				description: "Mod not found",
				content: {
					"application/json": {
						schema: resolver(
							z.object({
								error: z.string(),
							}),
						),
					},
				},
			},
			[StatusCodes.FORBIDDEN]: {
				description: "User is not a maintainer of this mod",
				content: {
					"application/json": {
						schema: resolver(
							z.object({
								error: z.string(),
							}),
						),
					},
				},
			},
			[StatusCodes.UNAUTHORIZED]: {
				description: "Authentication required",
			},
		},
	}),
	cookieAuth(),
	validator("param", z.object({ id: z.string() })),
	async (c) => {
		const { id } = c.req.valid("param");
		const user = c.var.getUser();
		const service = getUserModService(user);

		const result = await service.deleteMod(id);

		if (result === UserModServiceError.NotFound) {
			return c.json(
				{ error: `Mod with id '${id}' not found` },
				StatusCodes.NOT_FOUND,
			);
		}

		if (result === UserModServiceError.NotMaintainer) {
			logger.warn(
				`User '${user.id}' attempted to delete mod '${id}' which they do not maintain`,
			);
			return c.json(
				{ error: `Mod with id '${id}' not found` },
				StatusCodes.NOT_FOUND,
			);
		}

		return c.body(null, StatusCodes.OK);
	},
);

export default router;
