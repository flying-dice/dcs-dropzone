import { Hono } from "hono";
import { validator } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { getLogger } from "log4js";
import { z } from "zod";
import { describeJsonRoute } from "../../../common/describeJsonRoute.ts";
import { ModRelease } from "../entities/ModRelease.ts";
import findUpdateInformationByIds from "../queries/find-update-information-by-ids.ts";
import { ModLatestReleaseData } from "../schemas/ModLatestReleaseData.ts";

const router = new Hono();

const logger = getLogger("api/mod-updates");

router.post(
	"/",
	describeJsonRoute({
		operationId: "getModUpdatesByIds",
		summary: "Gets Release Information for a set of Mods",
		description: "Retrieves public releases for a specific set of mods by IDs.",
		tags: ["Mod Updates"],
		responses: {
			[StatusCodes.OK]: ModLatestReleaseData.array(),
		},
	}),
	validator("json", z.object({ ids: z.string() })),
	async (c) => {
		const { ids } = c.req.valid("json");

		logger.debug(`Fetching public releases for mod '${ids}'`);

		const releases = await findUpdateInformationByIds(
			{ modIds: ids.split(",") },
			{ orm: ModRelease },
		);

		return c.json(releases, StatusCodes.OK);
	},
);

export default router;
