import { getLogger } from "log4js";
import { User } from "../entities/User.ts";
import { UserData } from "../schemas/UserData.ts";
import type { AuthResult } from "../services/AuthService.ts";

const logger = getLogger("HandleAuthResultCommand");

export type HandleAuthResultCommand = {
	authResult: AuthResult;
};
export default async function ({
	authResult,
}: HandleAuthResultCommand): Promise<UserData> {
	logger.debug(
		{ id: authResult.id, username: authResult.username },
		"registerUserDetails start",
	);

	const user = UserData.parse({
		id: authResult.id,
		name: authResult.name,
		username: authResult.username,
		avatarUrl: authResult.avatarUrl,
		profileUrl: authResult.profileUrl,
	});

	await User.updateOne({ id: authResult.id }, user, { upsert: true }).exec();
	logger.debug({ userId: user.id }, "User registered/persisted");

	return user;
}
