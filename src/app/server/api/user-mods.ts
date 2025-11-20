import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import ApplicationContext from "../Application.ts";
import Logger from "../Logger.ts";
import { cookieAuth } from "../middleware/cookieAuth.ts";
import { ModCreateData } from "../schemas/ModCreateData.ts";
import { ModData } from "../schemas/ModData.ts";
import { ModSummaryData } from "../schemas/ModSummaryData.ts";
import { ModUpdateData } from "../schemas/ModUpdateData.ts";
import { UserModsMetaData } from "../schemas/UserModsMetaData.ts";
import { UserModServiceError } from "../services/UserModService.ts";
import { describeJsonRoute } from "./describeJsonRoute.ts";

const router = new Hono();

const logger = Logger.getLogger("api/user-mods");

/**
 * GET /api/user-mods - List all user's mods (summary view)
 */
router.get(
	"/",
	describeJsonRoute({
		operationId: "getUserMods",
		summary: "Get user mods",
		description:
			"Retrieves a list of all mods owned by the authenticated user.",
		tags: ["User Mods"],
		security: [{ cookieAuth: [] }],
		responses: {
			[StatusCodes.OK]: z.object({
				data: ModSummaryData.array(),
				meta: UserModsMetaData,
			}),
			[StatusCodes.UNAUTHORIZED]: null,
		},
	}),
	cookieAuth(),
	async (c) => {
		const user = c.var.getUser();
		const service = ApplicationContext.getUserModService(user);

		const mods = await service.findAllUserMods();

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
		description:
			"Retrieves a specific mod owned by the authenticated user by its ID.",
		tags: ["User Mods"],
		security: [{ cookieAuth: [] }],
		responses: {
			[StatusCodes.UNAUTHORIZED]: null,

			[StatusCodes.OK]: ModData,
			[StatusCodes.NOT_FOUND]: null,
		},
	}),
	cookieAuth(),
	validator("param", z.object({ id: z.string() })),
	async (c) => {
		const { id } = c.req.valid("param");
		const user = c.var.getUser();
		const service = ApplicationContext.getUserModService(user);

		logger.debug(`User '${user.id}' is requesting mod '${id}'`);

		const result = await service.findUserModById(id);

		if (result === UserModServiceError.NotFound) {
			throw new HTTPException(StatusCodes.NOT_FOUND);
		}

		return c.json(result, StatusCodes.OK);
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
			[StatusCodes.UNAUTHORIZED]: null,

			[StatusCodes.CREATED]: ModData,
			[StatusCodes.INTERNAL_SERVER_ERROR]: null,
		},
	}),
	cookieAuth(),
	validator("json", ModCreateData),
	async (c) => {
		const createRequest = c.req.valid("json");
		const user = c.var.getUser();
		const service = ApplicationContext.getUserModService(user);

		logger.debug(
			`User '${user.id}' is creating a new mod '${createRequest.name}'`,
		);
		const result = await service.createMod(createRequest);

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
			[StatusCodes.UNAUTHORIZED]: null,

			[StatusCodes.OK]: null,
			[StatusCodes.NOT_FOUND]: null,
		},
	}),
	cookieAuth(),
	validator("param", z.object({ id: z.string() })),
	validator("json", ModUpdateData),
	async (c) => {
		const { id } = c.req.valid("param");
		const updates = c.req.valid("json");
		const user = c.var.getUser();
		const service = ApplicationContext.getUserModService(user);

		const result = await service.updateMod(id, updates);

		if (result === UserModServiceError.NotFound) {
			throw new HTTPException(StatusCodes.NOT_FOUND);
		}

		return c.body(null, StatusCodes.OK);
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
			[StatusCodes.UNAUTHORIZED]: null,

			[StatusCodes.OK]: null,
			[StatusCodes.NOT_FOUND]: null,
		},
	}),
	cookieAuth(),
	validator("param", z.object({ id: z.string() })),
	async (c) => {
		const { id } = c.req.valid("param");
		const user = c.var.getUser();
		const service = ApplicationContext.getUserModService(user);

		const result = await service.deleteMod(id);

		if (result === UserModServiceError.NotFound) {
			throw new HTTPException(StatusCodes.NOT_FOUND);
		}

		return c.body(null, StatusCodes.OK);
	},
);

export default router;
