import { describeJsonRoute } from "@packages/hono/describeJsonRoute";
import { getLoggingHook } from "@packages/hono/getLoggingHook";
import { zParse } from "@packages/zod/zParse";
import { validator } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { getLogger } from "log4js";
import { z } from "zod";
import { ErrorData } from "../application/schemas/ErrorData.ts";
import { ModReleaseDownloadData } from "../application/schemas/ModReleaseDownloadData.ts";
import { OkData } from "../application/schemas/OkData.ts";
import ApplicationFactory from "../hono/ApplicationFactory.ts";

const logger = getLogger("RegisterModReleaseDownloadById");
const loggingHook = getLoggingHook(logger);

export const RegisterModReleaseDownloadById = ApplicationFactory.createHandlers(
	describeJsonRoute({
		operationId: "registerModReleaseDownloadById",
		summary: "Register mod release download by ID",
		description: "Registers a download for a specific public release for a mod by its ID.",
		tags: ["Mod Release Downloads"],
		responses: {
			[StatusCodes.OK]: OkData,
			[StatusCodes.NOT_FOUND]: ErrorData,
			[StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData,
		},
	}),
	validator(
		"param",
		z.object({
			id: z.string(),
			releaseId: z.string(),
		}),
		loggingHook,
	),
	validator("json", ModReleaseDownloadData.pick({ daemonInstanceId: true }), loggingHook),
	async (c) => {
		const { id, releaseId } = c.req.valid("param");
		const { daemonInstanceId } = c.req.valid("json");

		logger.debug(`Registering download for release '${releaseId}' for mod '${id}'`);

		const [, releaseError] = await c.var.app.publicMods.findPublicModReleaseById(id, releaseId);

		if (releaseError) {
			return c.json(zParse({ code: StatusCodes.NOT_FOUND, error: releaseError.constructor.name }, ErrorData));
		}

		await c.var.app.downloads.registerModReleaseDownload(id, releaseId, daemonInstanceId);
		return c.json(OkData.parse({ ok: true }), StatusCodes.OK);
	},
);
