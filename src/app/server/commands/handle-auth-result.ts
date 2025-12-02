import { getLogger } from "log4js";
import { z } from "zod";
import { User } from "../entities/User.ts";
import { UserData } from "../schemas/UserData.ts";

const logger = getLogger("commands/handle-auth-result");

const InputSchema = z.object({
	id: z.string(),
	username: z.string(),
	name: z.string().optional(),
	avatarUrl: z.string(),
	profileUrl: z.string(),
});
export type Input = z.infer<typeof InputSchema>;

export interface Deps {}

export default async function (input: Input, deps: Deps): Promise<UserData> {
	logger.debug(
		{ id: input.id, username: input.username },
		"registerUserDetails start",
	);

	const user = UserData.parse({
		id: input.id,
		name: input.name,
		username: input.username,
		avatarUrl: input.avatarUrl,
		profileUrl: input.profileUrl,
	});

	await User.updateOne({ id: input.id }, user, { upsert: true }).exec();
	logger.debug({ userId: user.id }, "User registered/persisted");

	return user;
}
