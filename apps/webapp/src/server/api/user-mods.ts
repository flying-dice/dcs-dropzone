import { describeJsonRoute } from "hono-utils/describeJsonRoute";
import { Hono } from "hono";
import { validator } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { getLogger } from "log4js";
import { z } from "zod";
import createMod from "../commands/CreateMod.ts";
import deleteMod from "../commands/DeleteMod.ts";
import updateMod from "../commands/UpdateMod.ts";
import { cookieAuth } from "../middleware/cookieAuth.ts";
import findAllUserMods from "../queries/FindAllUserMods.ts";
import findUserModById from "../queries/FindUserModById.ts";
import { ErrorData } from "../schemas/ErrorData.ts";
import { ModCreateData } from "../schemas/ModCreateData.ts";
import { ModData } from "../schemas/ModData.ts";
import { ModSummaryData } from "../schemas/ModSummaryData.ts";
import { ModUpdateData } from "../schemas/ModUpdateData.ts";
import { OkData } from "../schemas/OkData.ts";
import { UserModsMetaData } from "../schemas/UserModsMetaData.ts";

const router = new Hono();

const logger = getLogger("api/user-mods");

/**
 * GET /api/user-mods - List all user's mods (summary view)
 */
router.get(
	"/",
	describeJsonRoute({
		operationId: "getUserMods",
		summary: "Get user mods",
		description: "Retrieves a list of all mods owned by the authenticated user.",
		tags: ["User Mods"],
		security: [{ cookieAuth: [] }],
		responses: {
			[StatusCodes.OK]: z.object({
				data: ModSummaryData.array(),
				meta: UserModsMetaData,
			}),
			[StatusCodes.UNAUTHORIZED]: ErrorData,
			[StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData,
		},
	}),
	cookieAuth(),
	async (c) => {
		const user = c.var.getUser();

		const mods = await findAllUserMods({
			user,
		});

		return c.json(mods, StatusCodes.OK);
	},
);

/**
 * GET /api/user-mods/:id - Get a specific user mod by ID
 */
router.get(
	"/:id",
	describeJsonRoute({
		operationId: "getUserModById",
		summary: "Get user mod by ID",
		description: "Retrieves a specific mod owned by the authenticated user by its ID.",
		tags: ["User Mods"],
		security: [{ cookieAuth: [] }],
		responses: {
			[StatusCodes.OK]: ModData,
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

		logger.debug(`User '${user.id}' is requesting mod '${id}'`);

		const result = await findUserModById({
			modId: id,
			user,
		});

		return result.match(
			(body) => {
				return c.json(body, StatusCodes.OK);
			},
			(error) => {
				return c.json(
					ErrorData.parse({
						code: StatusCodes.NOT_FOUND,
						error,
					}),
					StatusCodes.NOT_FOUND,
				);
			},
		);
	},
);

/**
 * POST /api/user-mods - Create a new mod
 */
router.post(
	"/",
	describeJsonRoute({
		operationId: "createUserMod",
		summary: "Create user mod",
		description: "Creates a new mod owned by the authenticated user.",
		tags: ["User Mods"],
		security: [{ cookieAuth: [] }],
		responses: {
			[StatusCodes.UNAUTHORIZED]: ErrorData,
			[StatusCodes.CREATED]: ModData,
			[StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData,
		},
	}),
	cookieAuth(),
	validator("json", ModCreateData),
	async (c) => {
		const createData = c.req.valid("json");
		const user = c.var.getUser();

		logger.debug(`User '${user.id}' is creating a new mod '${createData.name}'`);
		const result = await createMod({
			user,
			createData,
		});

		return c.json(result, StatusCodes.CREATED);
	},
);

/**
 * PUT /api/user-mods/:id - Update an existing mod
 */
router.put(
	"/:id",
	describeJsonRoute({
		operationId: "updateUserMod",
		summary: "Update user mod",
		description: "Updates an existing mod owned by the authenticated user.",
		tags: ["User Mods"],
		security: [{ cookieAuth: [] }],
		responses: {
			[StatusCodes.OK]: OkData,
			[StatusCodes.NOT_FOUND]: ErrorData,
			[StatusCodes.UNAUTHORIZED]: ErrorData,
			[StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData,
		},
	}),
	cookieAuth(),
	validator("param", z.object({ id: z.string() })),
	validator("json", ModUpdateData),
	async (c) => {
		const { id } = c.req.valid("param");
		const updateData = c.req.valid("json");
		const user = c.var.getUser();

		const result = await updateMod({
			user,
			modId: id,
			updateData,
		});

		return result.match(
			() => {
				return c.json(OkData.parse({ ok: true }), StatusCodes.OK);
			},
			(error) => {
				return c.json(
					ErrorData.parse({
						code: StatusCodes.NOT_FOUND,
						error,
					}),
					StatusCodes.NOT_FOUND,
				);
			},
		);
	},
);

/**
 * DELETE /api/user-mods/:id - Delete a mod
 */
router.delete(
	"/:id",
	describeJsonRoute({
		operationId: "deleteUserMod",
		summary: "Delete user mod",
		description: "Deletes an existing mod owned by the authenticated user.",
		tags: ["User Mods"],
		security: [{ cookieAuth: [] }],
		responses: {
			[StatusCodes.OK]: OkData,
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

		const result = await deleteMod({ user, id });

		return result.match(
			() => {
				return c.json(OkData.parse({ ok: true }), StatusCodes.OK);
			},
			(error) => {
				return c.json(
					ErrorData.parse({
						code: StatusCodes.NOT_FOUND,
						error,
					}),
					StatusCodes.NOT_FOUND,
				);
			},
		);
	},
);

export default router;
