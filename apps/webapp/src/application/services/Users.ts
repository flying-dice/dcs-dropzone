import { getLogger } from "log4js";
import { err, ok, type Result } from "neverthrow";
import { UserNotFoundError } from "../errors.ts";
import type { UserRepository } from "../ports/UserRepository.ts";
import { UserData } from "../schemas/UserData.ts";

const logger = getLogger("Users");

type Deps = {
	userRepository: UserRepository;
};

export class Users {
	constructor(protected readonly deps: Deps) {}

	async saveUserDetails(user: UserData): Promise<UserData> {
		logger.info("Saving user details", { userId: user.id, username: user.username });
		const saved = await this.deps.userRepository.saveUserDetails(UserData.parse(user));
		logger.debug("User details saved", { userId: user.id });
		return UserData.parse(saved);
	}

	async getUserById(userId: string): Promise<Result<UserData, UserNotFoundError>> {
		logger.debug("Fetching user by ID", { userId });
		const user = await this.deps.userRepository.findById(userId);

		if (!user) {
			logger.info("User not found", { userId });
			return err(new UserNotFoundError());
		}

		logger.debug("User fetched", { userId, username: user.username });
		return ok(UserData.parse(user));
	}
}
