import { getLogger } from "log4js";
import { z } from "zod";
import { Mod } from "../entities/Mod.ts";
import { ModUpdateData } from "../schemas/ModUpdateData.ts";

const logger = getLogger("commands/update-mod");

const InputSchema = z.object({
	userId: z.string(),
	modId: z.string(),
	data: ModUpdateData,
});
export type Input = z.infer<typeof InputSchema>;

export interface Deps {
	orm: typeof Mod;
}

export default async function (
	input: Input,
	deps: Deps,
): Promise<boolean> {
	logger.debug(
		{ userId: input.userId, modId: input.modId },
		"updateMod start",
	);

	const mod = await deps.orm
		.findOneAndUpdate(
			{ id: input.modId, maintainers: input.userId },
			input.data,
		)
		.exec();

	if (!mod) {
		logger.warn(
			{ modId: input.modId },
			"User attempted to update mod but it was not found",
		);
		return false;
	}

	logger.debug({ modId: input.modId }, "User successfully updated mod");
	return true;
}
