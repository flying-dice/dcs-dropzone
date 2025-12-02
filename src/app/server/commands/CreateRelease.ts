import { err, ok, type Result } from "neverthrow";
import { ModVisibility } from "../../../common/data.ts";
import { Mod } from "../entities/Mod.ts";
import { ModRelease } from "../entities/ModRelease.ts";
import type { ModReleaseCreateData } from "../schemas/ModReleaseCreateData.ts";
import { ModReleaseData } from "../schemas/ModReleaseData.ts";
import type { UserData } from "../schemas/UserData.ts";

export type CreateReleaseCommand = {
	user: UserData;
	modId: string;
	createData: ModReleaseCreateData;
};

export type CreateReleaseResult = Result<ModReleaseData, "ModNotFound">;

export default async function (command: CreateReleaseCommand): Promise<CreateReleaseResult> {
	const { user, modId, createData } = command;

	const mod = await Mod.findOne({ id: modId, maintainers: user.id }).exec();
	if (!mod) return err("ModNotFound");

	const id = crypto.randomUUID();
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
	return ok(ModReleaseData.parse(result));
}
