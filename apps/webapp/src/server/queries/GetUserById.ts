import { getLogger } from "log4js";
import { err, ok, type Result } from "neverthrow";
import { UserData } from "../application/schemas/UserData.ts";
import { User } from "../infrastructure/mongo-db/entities/User.ts";

const logger = getLogger("GetUserById");

export type GetUserByIdResult = Result<UserData, "UserNotFound">;

export default async function (userId: string): Promise<GetUserByIdResult> {
	logger.debug({ userId }, "getUserById start");
	const user = await User.findOne({ id: userId }).lean().exec();
	if (!user) {
		logger.warn({ userId }, "getUserById user not found");
		return err("UserNotFound");
	}
	logger.debug({ userId: user.id, username: user.username }, "getUserById success");
	return ok(UserData.parse(user));
}
