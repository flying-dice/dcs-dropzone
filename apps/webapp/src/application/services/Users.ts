import { getLogger } from "log4js";
import { err, ok, type Result } from "neverthrow";
import type { AuthResult } from "../ports/AuthenticationProvider.ts";
import type { UserRepository } from "../ports/UserRepository.ts";
import { UserData } from "../schemas/UserData.ts";

const logger = getLogger("Users");

type Deps = {
	userRepository: UserRepository;
};

export class Users {
	constructor(protected readonly deps: Deps) {}

	async getUserById(userId: string): Promise<Result<UserData, "UserNotFound">> {
		const user = await this.deps.userRepository.findById(userId);

		if (!user) {
			logger.warn({ userId }, "getUserById user not found");
			return err("UserNotFound");
		}

		return ok(UserData.parse(user));
	}

	async createFromAuthResult(authResult: AuthResult): Promise<UserData> {
		logger.debug({ id: authResult.id, username: authResult.username }, "registerUserDetails start");

		const user = UserData.parse({
			id: authResult.id,
			name: authResult.name,
			username: authResult.username,
			avatarUrl: authResult.avatarUrl,
			profileUrl: authResult.profileUrl,
		});

		const saved = await this.deps.userRepository.saveUserDetails(user);

		logger.debug({ userId: user.id }, "User registered/persisted");

		return UserData.parse(saved);
	}
}
