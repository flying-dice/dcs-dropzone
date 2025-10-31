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
 * GET /api/mods - List all mods (summary view)
 */
router.get(
	"/",
	describeRoute({
		summary: "List all mods",
		description:
			"Get a list of all mods with summary information (without content and versions)",
		tags: ["Mods"],
		responses: {
			[StatusCodes.OK]: {
				description: "List of mods",
				content: {
					"application/json": {
						schema: resolver(z.array(modSummarySchema)),
					},
				},
			},
		},
	}),
	async (c) => {
		const mods = await modService.getAllMods();
		return c.json(mods, StatusCodes.OK);
	},
);

/**
 * GET /api/mods/maintainer/:userId - Get mods by maintainer
 */
router.get(
	"/maintainer/:userId",
	describeRoute({
		summary: "Get mods by maintainer",
		description: "Get all mods maintained by a specific user",
		tags: ["Mods"],
		responses: {
			[StatusCodes.OK]: {
				description: "List of mods maintained by the user",
				content: {
					"application/json": {
						schema: resolver(z.array(modSummarySchema)),
					},
				},
			},
		},
	}),
	validator("param", z.object({ userId: z.string() })),
	async (c) => {
		const { userId } = c.req.valid("param");
		const mods = await modService.getModsByMaintainer(userId);
		return c.json(mods, StatusCodes.OK);
	},
);

/**
 * GET /api/mods/:id - Get a specific mod by ID
 */
router.get(
	"/:id",
	describeRoute({
		summary: "Get mod by ID",
		description:
			"Get detailed information about a specific mod including content and versions",
		tags: ["Mods"],
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
		},
	}),
	validator("param", z.object({ id: z.string() })),
	async (c) => {
		const { id } = c.req.valid("param");
		const mod = await modService.getModById(id);

		if (!mod) {
			return c.json(
				{ error: `Mod with id '${id}' not found` },
				StatusCodes.NOT_FOUND,
			);
		}

		return c.json(mod, StatusCodes.OK);
	},
);

/**
 * POST /api/mods - Create a new mod
 */
router.post(
	"/",
	describeRoute({
		summary: "Create a new mod",
		description:
			"Create a new mod. Requires authentication. The authenticated user will be added as a maintainer.",
		tags: ["Mods"],
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
 * PUT /api/mods/:id - Update an existing mod
 */
router.put(
	"/:id",
	describeRoute({
		summary: "Update a mod",
		description:
			"Update an existing mod. Requires authentication and user must be a maintainer.",
		tags: ["Mods"],
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
			return c.json(
				{
					error:
						error instanceof Error ? error.message : "Failed to update mod",
				},
				StatusCodes.FORBIDDEN,
			);
		}
	},
);

/**
 * DELETE /api/mods/:id - Delete a mod
 */
router.delete(
	"/:id",
	describeRoute({
		summary: "Delete a mod",
		description:
			"Delete an existing mod. Requires authentication and user must be a maintainer.",
		tags: ["Mods"],
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
			return c.json(
				{
					error:
						error instanceof Error ? error.message : "Failed to delete mod",
				},
				StatusCodes.FORBIDDEN,
			);
		}
	},
);

export default router;
