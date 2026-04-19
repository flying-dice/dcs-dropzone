import { describeJsonRoute } from "@packages/hono/describeJsonRoute";
import { getLoggingHook } from "@packages/hono/getLoggingHook";
import { zParse } from "@packages/zod/zParse";
import { validator } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { getLogger } from "log4js";
import { z } from "zod";
import { ErrorData } from "../application/schemas/ErrorData.ts";
import { ModData } from "../application/schemas/ModData.ts";
import { TypedErrorData } from "../application/schemas/TypedErrorData.ts";
import { UserData } from "../application/schemas/UserData.ts";
import ApplicationFactory from "../hono/ApplicationFactory.ts";

const ModByIdErrors = z.enum(["ModNotFoundError"]);
const ModByIdNotFound = TypedErrorData(ModByIdErrors);

const logger = getLogger("GetModById");
const loggingHook = getLoggingHook(logger);

export const GetModById = ApplicationFactory.createHandlers(
	describeJsonRoute({
		operationId: "getModById",
		summary: "Get mod by ID",
		description: "Retrieves a specific published mod by its ID.",
		tags: ["Mods"],
		responses: {
			[StatusCodes.OK]: z.object({
				mod: ModData,
				maintainers: UserData.array(),
			}),
			[StatusCodes.NOT_FOUND]: ModByIdNotFound,
			[StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData,
		},
	}),
	validator(
		"param",
		z.object({
			id: z.string(),
		}),
		loggingHook,
	),
	async (c) => {
		const { id } = c.req.valid("param");

		const [mod, modError] = await c.var.app.publicMods.getModById(id);

		if (modError) {
			return c.json(
				zParse({ code: StatusCodes.NOT_FOUND, error: modError.name }, ModByIdNotFound),
				StatusCodes.NOT_FOUND,
			);
		}

		return c.json(mod, StatusCodes.OK);
	},
);
