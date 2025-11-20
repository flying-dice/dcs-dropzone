import { User } from "../entities/User.ts";
import Logger from "../Logger.ts";
import { UserData } from "../schemas/UserData.ts";
import type { AuthResult } from "./AuthService.ts";

const logger = Logger.getLogger("UserService");

export class UserService {
	async getUserById(userId: string): Promise<UserData> {
		logger.debug({ userId }, "getUserById start");
		const user = await User.findOne({ id: userId }).lean().exec();
		if (!user) {
			logger.warn({ userId }, "getUserById user not found");
			throw new Error("User not found");
		}
		logger.debug(
			{ userId: user.id, username: user.username },
			"getUserById success",
		);
		return UserData.parse(user);
	}

	async handleAuthResult(authResult: AuthResult): Promise<UserData> {
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

	async getAllUsers(): Promise<UserData[]> {
		logger.debug("getAllUsers start");
		const users = await User.find().lean().exec();
		logger.debug(`getAllUsers found ${users.length} users`);
		return UserData.array().parse(users);
	}
}
