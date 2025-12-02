import { getLogger } from "log4js";
import { z } from "zod";
import { User } from "../entities/User.ts";
import { UserData } from "../schemas/UserData.ts";

const logger = getLogger("queries/get-user-by-id");

const InputSchema = z.object({
	userId: z.string(),
});
export type Input = z.infer<typeof InputSchema>;

export interface Deps {
	orm: typeof User;
}

export default async function (
	input: Input,
	deps: Deps,
): Promise<UserData | null> {
	logger.debug({ userId: input.userId }, "getUserById start");
	const user = await deps.orm.findOne({ id: input.userId }).lean().exec();
	if (!user) {
		logger.warn({ userId: input.userId }, "getUserById user not found");
		return null;
	}
	logger.debug(
		{ userId: user.id, username: user.username },
		"getUserById success",
	);
	return UserData.parse(user);
}
