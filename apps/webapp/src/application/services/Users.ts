import { Log } from "@packages/decorators";
import { getLogger } from "log4js";
import { err, ok, type Result } from "neverthrow";
import type { UserRepository } from "../ports/UserRepository.ts";
import { UserData } from "../schemas/UserData.ts";

const logger = getLogger("Users");

type Deps = {
	userRepository: UserRepository;
};

export class Users {
	constructor(protected readonly deps: Deps) {}

	@Log(logger)
	async saveUserDetails(user: UserData): Promise<UserData> {
		logger.info("Saving user details", { userId: user.id, username: user.username });
		try {
			const saved = await this.deps.userRepository.saveUserDetails(UserData.parse(user));
			logger.debug("User details saved", { userId: user.id });
			return UserData.parse(saved);
		} catch (error) {
			logger.error("Failed to save user details", { userId: user.id, error });
			throw error;
		}
	}

	@Log(logger)
	async getUserById(userId: string): Promise<Result<UserData, "UserNotFound">> {
		logger.debug("Fetching user by ID", { userId });
		const user = await this.deps.userRepository.findById(userId);

		if (!user) {
			logger.info("User not found", { userId });
			return err("UserNotFound");
		}

		logger.debug("User fetched", { userId, username: user.username });
		return ok(UserData.parse(user));
	}
}
