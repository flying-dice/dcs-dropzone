import { getLogger } from "log4js";
import { z } from "zod";
import { Mod } from "../entities/Mod.ts";
import { ModData } from "../schemas/ModData.ts";

const logger = getLogger("queries/find-user-mod-by-id");

const InputSchema = z.object({
	userId: z.string(),
	modId: z.string(),
});
export type Input = z.infer<typeof InputSchema>;

export interface Deps {
	orm: typeof Mod;
}

export default async function (
	input: Input,
	deps: Deps,
): Promise<ModData | null> {
	logger.debug(
		{ userId: input.userId, modId: input.modId },
		"findUserModById start",
	);
	const mod = await deps.orm
		.findOne({ id: input.modId, maintainers: input.userId })
		.lean()
		.exec();

	if (!mod) {
		logger.debug(
			{ modId: input.modId },
			"User attempted to fetch mod but it was not found",
		);
		return null;
	}

	logger.debug({ modId: input.modId }, "User successfully fetched mod");

	return ModData.parse(mod);
}
