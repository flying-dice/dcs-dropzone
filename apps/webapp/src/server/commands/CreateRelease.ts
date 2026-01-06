import { err, ok, type Result } from "neverthrow";
import objectHash from "object-hash";
import { Mod } from "../infrastructure/mongo-db/entities/Mod.ts";
import { ModRelease } from "../infrastructure/mongo-db/entities/ModRelease.ts";
import { ModVisibility } from "../application/enums/ModVisibility.ts";
import type { ModReleaseCreateData } from "../application/schemas/ModReleaseCreateData.ts";
import { ModReleaseData } from "../application/schemas/ModReleaseData.ts";
import type { UserData } from "../application/schemas/UserData.ts";

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
		modId,
		version: createData.version,
		versionHash: objectHash(Date.now()),
		changelog: "Describe changes since last version...",
		assets: [],
		symbolicLinks: [],
		missionScripts: [],
		visibility: ModVisibility.PUBLIC,
		downloadsCount: 0,
	};

	const result = await ModRelease.create(ModReleaseData.parse(releaseData));
	return ok(ModReleaseData.parse(result));
}
