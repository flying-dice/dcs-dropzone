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
		const saved = await this.deps.userRepository.saveUserDetails(UserData.parse(user));
		return UserData.parse(saved);
	}

	@Log(logger)
	async getUserById(userId: string): Promise<Result<UserData, "UserNotFound">> {
		const user = await this.deps.userRepository.findById(userId);

		if (!user) {
			logger.warn("getUserById user not found", { userId });
			return err("UserNotFound");
		}

		return ok(UserData.parse(user));
	}
}
