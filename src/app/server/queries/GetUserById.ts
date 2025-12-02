import { getLogger } from "log4js";
import { User } from "../entities/User.ts";
import { UserData } from "../schemas/UserData.ts";

const logger = getLogger("GetUserById");

export async function getUserById(userId: string): Promise<UserData> {
	logger.debug({ userId }, "getUserById start");
	const user = await User.findOne({ id: userId }).lean().exec();
	if (!user) {
		logger.warn({ userId }, "getUserById user not found");
		throw new Error("User not found");
	}
	logger.debug({ userId: user.id, username: user.username }, "getUserById success");
	return UserData.parse(user);
}
