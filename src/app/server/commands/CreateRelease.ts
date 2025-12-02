import { getLogger } from "log4js";
import { err, ok, type Result } from "neverthrow";
import { ModVisibility } from "../../../common/data.ts";
import { Mod } from "../entities/Mod.ts";
import { ModRelease } from "../entities/ModRelease.ts";
import type { ModReleaseCreateData } from "../schemas/ModReleaseCreateData.ts";
import { ModReleaseData } from "../schemas/ModReleaseData.ts";
import type { UserData } from "../schemas/UserData.ts";

const logger = getLogger("CreateRelease");

export type CreateReleaseCommand = {
	user: UserData;
	modId: string;
	createData: ModReleaseCreateData;
};
export async function createRelease({
	user,
	modId,
	createData,
}: CreateReleaseCommand): Promise<Result<ModReleaseData, "NotFound">> {
	logger.debug({ userId: user.id, modId, createData }, "createRelease start");

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
