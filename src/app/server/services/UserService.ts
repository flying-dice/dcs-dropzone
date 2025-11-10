import { User } from "../domain/User.ts";
import { UserToken } from "../domain/UserToken.ts";
import Logger from "../Logger.ts";
import type { UserRepository } from "../repository/UserRepository.ts";
import type { UserData } from "../schemas/UserData.ts";
import type { AuthResult } from "./AuthService.ts";

const logger = Logger.getLogger("UserService");

export class UserService {
	constructor(protected userRepository: UserRepository) {}

	async getUserById(userId: string): Promise<UserData> {
		logger.debug({ userId }, "getUserById start");
		const user = await this.userRepository.getById(userId);
		if (!user) {
			logger.warn({ userId }, "getUserById user not found");
			throw new Error("User not found");
		}
		const data = user.toData();
		logger.debug(
			{ userId: data.id, username: data.username },
			"getUserById success",
		);
		return data;
	}

	async refreshUserAndIssueTokenForAuthResult(
		authResult: AuthResult,
	): Promise<string> {
		logger.debug(
			{ id: authResult.id, username: authResult.username },
			"issueTokenForAuthResult start",
		);

		const user = new User({
			id: authResult.id,
			name: authResult.name,
			username: authResult.username,
			avatarUrl: authResult.avatarUrl,
			profileUrl: authResult.profileUrl,
		});

		await this.userRepository.save(user);
		logger.debug({ userId: user.id }, "User persisted");

		const token = await new UserToken({ userId: user.id }).toTokenString();
		logger.debug({ userId: user.id }, "Token issued for user");
		return token;
	}
}
