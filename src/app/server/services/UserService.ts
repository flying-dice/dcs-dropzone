import { User } from "../entities/User.ts";
import Logger from "../Logger.ts";
import { UserData } from "../schemas/UserData.ts";
import type { AuthResult } from "./AuthService.ts";
import type { UserTokenService } from "./UserTokenService.ts";

const logger = Logger.getLogger("UserService");

export class UserService {
	constructor(private readonly tokenService: UserTokenService) {}
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

	async getUserByToken(tokenString: string): Promise<UserData> {
		logger.debug("getUserByToken start");
		const tokenData = await this.tokenService.parseTokenString(tokenString);
		return this.getUserById(tokenData.userId);
	}

	async refreshUserAndIssueTokenForAuthResult(
		authResult: AuthResult,
	): Promise<string> {
		logger.debug(
			{ id: authResult.id, username: authResult.username },
			"refreshUserAndIssueTokenForAuthResult start",
		);

		const user = UserData.parse({
			id: authResult.id,
			name: authResult.name,
			username: authResult.username,
			avatarUrl: authResult.avatarUrl,
			profileUrl: authResult.profileUrl,
		});

		await User.updateOne({ id: authResult.id }, user, { upsert: true }).exec();
		logger.debug({ userId: user.id }, "User persisted");

		const token = await this.tokenService.issueTokenString(user.id);
		logger.debug({ userId: user.id }, "Token issued for user");
		return token;
	}
}
