import { getLogger } from "log4js";
import { err, ok } from "neverthrow";
import { ModVisibility } from "../../../../common/data.ts";
import { Mod } from "../../entities/Mod.ts";
import { ModRelease } from "../../entities/ModRelease.ts";
import { ModReleaseData } from "../../schemas/ModReleaseData.ts";
import type { Command, CommandResult } from "./types.ts";

const logger = getLogger("CreateRelease");

export async function handler(command: Command): Promise<CommandResult> {
	const { user, modId, createData } = command;
	logger.debug({ userId: user.id, modId, createData }, "start");

	const id = crypto.randomUUID();

	const mod = await Mod.findOne({ id: modId }).exec();
	if (!mod) {
		logger.warn({ modId }, "Mod not found when creating release");
		return err("NotFound");
	}

	const releaseData: ModReleaseData = {
		id,
		mod_id: modId,
		version: createData.version,
		changelog: "abc",
		assets: [],
		symbolicLinks: [],
		missionScripts: [],
		visibility: ModVisibility.PUBLIC,
	};

	const result = await ModRelease.create(ModReleaseData.parse(releaseData));
	logger.debug({ releaseId: id }, "User successfully created release");

	return ok(ModReleaseData.parse(result));
}
