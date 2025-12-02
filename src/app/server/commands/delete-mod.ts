import { getLogger } from "log4js";
import { z } from "zod";
import { Mod } from "../entities/Mod.ts";

const logger = getLogger("commands/delete-mod");

const InputSchema = z.object({
	userId: z.string(),
	modId: z.string(),
});
export type Input = z.infer<typeof InputSchema>;

export interface Deps {}

export default async function (
	input: Input,
	deps: Deps,
): Promise<boolean> {
	logger.debug(
		{ userId: input.userId, modId: input.modId },
		"deleteMod start",
	);

	const result = await Mod.findOneAndDelete({
		id: input.modId,
		maintainers: input.userId,
	}).exec();

	if (!result) {
		logger.warn(
			{ modId: input.modId },
			"User attempted to delete mod but it was not found",
		);
		return false;
	}

	logger.debug({ modId: input.modId }, "User successfully deleted mod");
	return true;
}
