import { Hono } from "hono";
import { describeRoute, resolver, validator } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { db } from "../db.ts";
import {
	createModSchema,
	modSchema,
	modSummarySchema,
	updateModSchema,
} from "../domain/mod.schema.ts";
import { cookieAuth } from "../middleware/cookieAuth.ts";
import { MongoModRepository } from "../repositories/mod.repository.ts";
import { ModService } from "../services/mod.service.ts";

const router = new Hono();

// Initialize repository and service
const modRepository = new MongoModRepository(db.mods);
const modService = new ModService(modRepository);

/**
 * GET /api/user-mods - List all user's mods (summary view)
 */
router.get(
	"/",
	describeRoute({
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
						schema: resolver(z.array(modSummarySchema)),
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
		const mods = await modService.getModsByMaintainer(user.userId);
		return c.json(mods, StatusCodes.OK);
	},
);

/**
 * GET /api/user-mods/:id - Get a specific user mod by ID
 */
router.get(
	"/:id",
	describeRoute({
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
						schema: resolver(modSchema),
					},
				},
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
		const mod = await modService.getModById(id);

		if (!mod) {
			return c.json(
				{ error: `Mod with id '${id}' not found` },
				StatusCodes.NOT_FOUND,
			);
		}

		// Check if user is a maintainer
		if (!mod.maintainers.includes(user.userId)) {
			return c.json(
				{ error: "User is not a maintainer of this mod" },
				StatusCodes.FORBIDDEN,
			);
		}

		return c.json(mod, StatusCodes.OK);
	},
);

/**
 * POST /api/user-mods - Create a new mod
 */
router.post(
	"/",
	describeRoute({
		summary: "Create a new mod",
		description:
			"Create a new mod. Requires authentication. The authenticated user will be added as a maintainer.",
		tags: ["User Mods"],
		security: [{ cookieAuth: [] }],
		responses: {
			[StatusCodes.CREATED]: {
				description: "Mod created successfully",
				content: {
					"application/json": {
						schema: resolver(modSchema),
					},
				},
			},
			[StatusCodes.BAD_REQUEST]: {
				description: "Invalid input or mod already exists",
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
	validator("json", createModSchema),
	async (c) => {
		const modData = c.req.valid("json");
		const user = c.var.getUser();

		try {
			const mod = await modService.createMod(modData, user.userId);
			return c.json(mod, StatusCodes.CREATED);
		} catch (error) {
			return c.json(
				{
					error:
						error instanceof Error ? error.message : "Failed to create mod",
				},
				StatusCodes.BAD_REQUEST,
			);
		}
	},
);

/**
 * PUT /api/user-mods/:id - Update an existing mod
 */
router.put(
	"/:id",
	describeRoute({
		summary: "Update a mod",
		description:
			"Update an existing mod. Requires authentication and user must be a maintainer.",
		tags: ["User Mods"],
		security: [{ cookieAuth: [] }],
		responses: {
			[StatusCodes.OK]: {
				description: "Mod updated successfully",
				content: {
					"application/json": {
						schema: resolver(modSchema),
					},
				},
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
	validator("json", updateModSchema),
	async (c) => {
		const { id } = c.req.valid("param");
		const updates = c.req.valid("json");
		const user = c.var.getUser();

		try {
			const mod = await modService.updateMod(id, updates, user.userId);

			if (!mod) {
				return c.json(
					{ error: `Mod with id '${id}' not found` },
					StatusCodes.NOT_FOUND,
				);
			}

			return c.json(mod, StatusCodes.OK);
		} catch (error) {
			// Differentiate error types for proper status codes
			if (
				error &&
				typeof error === "object" &&
				"message" in error &&
				typeof error.message === "string"
			) {
				if (
					error.message.includes("not a maintainer") ||
					error.message.includes("not authorized")
				) {
					return c.json({ error: error.message }, StatusCodes.FORBIDDEN);
				}
				if (
					error.message.includes("not found") ||
					error.message.includes("does not exist")
				) {
					return c.json({ error: error.message }, StatusCodes.NOT_FOUND);
				}
				// Validation errors or other known errors
				return c.json({ error: error.message }, StatusCodes.BAD_REQUEST);
			}
			// Unknown error type
			return c.json(
				{ error: "Failed to update mod" },
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	},
);

/**
 * DELETE /api/user-mods/:id - Delete a mod
 */
router.delete(
	"/:id",
	describeRoute({
		summary: "Delete a mod",
		description:
			"Delete an existing mod. Requires authentication and user must be a maintainer.",
		tags: ["User Mods"],
		security: [{ cookieAuth: [] }],
		responses: {
			[StatusCodes.NO_CONTENT]: {
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

		try {
			const deleted = await modService.deleteMod(id, user.userId);

			if (!deleted) {
				return c.json(
					{ error: `Mod with id '${id}' not found` },
					StatusCodes.NOT_FOUND,
				);
			}

			return c.body(null, StatusCodes.NO_CONTENT);
		} catch (error) {
			// Differentiate error types for proper status codes
			if (
				error &&
				typeof error === "object" &&
				"message" in error &&
				typeof error.message === "string"
			) {
				if (
					error.message.includes("not a maintainer") ||
					error.message.includes("not authorized")
				) {
					return c.json({ error: error.message }, StatusCodes.FORBIDDEN);
				} else if (
					error.message.includes("not found") ||
					error.message.includes("does not exist")
				) {
					return c.json({ error: error.message }, StatusCodes.NOT_FOUND);
				} else {
					return c.json(
						{ error: error.message },
						StatusCodes.INTERNAL_SERVER_ERROR,
					);
				}
			} else {
				return c.json(
					{ error: "Failed to delete mod" },
					StatusCodes.INTERNAL_SERVER_ERROR,
				);
			}
		}
	},
);

export default router;
