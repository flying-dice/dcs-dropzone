import { describeJsonRoute } from "@packages/hono/describeJsonRoute";
import { getLoggingHook } from "@packages/hono/getLoggingHook";
import { ze } from "@packages/zod/ze";
import { validator } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { getLogger } from "log4js";
import { z } from "zod";
import { ErrorData } from "../application/schemas/ErrorData.ts";
import { ModAvailableFilterData } from "../application/schemas/ModAvailableFilterData.ts";
import { ModSummaryData } from "../application/schemas/ModSummaryData.ts";
import { PageData } from "../application/schemas/PageData.ts";
import ApplicationFactory from "../hono/ApplicationFactory.ts";

const logger = getLogger("GetMods");
const loggingHook = getLoggingHook(logger);

export const GetMods = ApplicationFactory.createHandlers(
	describeJsonRoute({
		operationId: "getMods",
		summary: "Get mods",
		description: "Retrieves a paginated list of all published mods.",
		tags: ["Mods"],
		responses: {
			[StatusCodes.OK]: z.object({
				data: ModSummaryData.array(),
				page: PageData,
				filter: ModAvailableFilterData,
			}),
			[StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData,
		},
	}),
	validator(
		"query",
		z.object({
			page: PageData.shape.number,
			size: PageData.shape.size,
			category: ModSummaryData.shape.category.optional(),
			maintainers: ze.csv().optional(),
			tags: ze.csv().optional(),
			term: z.string().optional(),
		}),
		loggingHook,
	),
	async (c) => {
		const { page, size, category, maintainers, tags, term } = c.req.valid("query");

		const result = await c.var.app.publicMods.getAllPublishedMods({
			page,
			size,
			filter: {
				category,
				maintainers,
				tags,
				term,
			},
		});

		return c.json(result, StatusCodes.OK);
	},
);
