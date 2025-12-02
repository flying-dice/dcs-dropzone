import { getLogger } from "log4js";
import { z } from "zod";
import { ModVisibility } from "../../../common/data.ts";
import { ModRelease } from "../entities/ModRelease.ts";
import { ModReleaseCreateData } from "../schemas/ModReleaseCreateData.ts";
import { ModReleaseData } from "../schemas/ModReleaseData.ts";

const logger = getLogger("commands/create-release");

const InputSchema = z.object({
	userId: z.string(),
	modId: z.string(),
	data: ModReleaseCreateData,
});
export type Input = z.infer<typeof InputSchema>;

export interface Deps {
	generateId: () => string;
}

export default async function (
	input: Input,
	deps: Deps,
): Promise<ModReleaseData> {
	logger.debug(
		{ userId: input.userId, modId: input.modId, createData: input.data },
		"createRelease start",
	);

	const id = deps.generateId();

	const releaseData: ModReleaseData = {
		id,
		mod_id: input.modId,
		version: input.data.version,
		changelog: "abc",
		assets: [],
		symbolicLinks: [],
		missionScripts: [],
		visibility: ModVisibility.PUBLIC,
	};

	const result = await ModRelease.create(ModReleaseData.parse(releaseData));
	logger.debug({ releaseId: id }, "User successfully created release");

	return ModReleaseData.parse(result);
}
