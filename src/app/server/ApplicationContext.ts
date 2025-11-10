import Database from "./Database.ts";
import Logger from "./Logger.ts";
import { MongoModRepository } from "./repository/impl/MongoModRepository.ts";
import { MongoUserRepository } from "./repository/impl/MongoUserRepository.ts";
import type { ModRepository } from "./repository/ModRepository.ts";
import type { UserRepository } from "./repository/UserRepository.ts";
import type { UserData } from "./schemas/UserData.ts";
import type { AuthService } from "./services/AuthService.ts";
import { AuthServiceProvider } from "./services/AuthServiceProvider.ts";
import { GithubAuthService } from "./services/GithubAuthService.ts";
import { UserModService } from "./services/UserModService.ts";
import { UserService } from "./services/UserService.ts";

const logger = Logger.getLogger("ApplicationContext");

logger.debug("Initializing repositories");
const userRepository: UserRepository = new MongoUserRepository(
	Database.instance,
);
await userRepository.postConstruct();
const modRepository: ModRepository = new MongoModRepository(Database.instance);
await modRepository.postConstruct();
logger.debug("Repositories initialized");

logger.debug("Initializing services");
export const userService: UserService = new UserService(userRepository);
logger.debug("Services initialized");

export function getAuthService(provider: AuthServiceProvider): AuthService {
	logger.debug({ provider }, "Selecting AuthService provider");
	switch (provider) {
		case AuthServiceProvider.GITHUB:
			return new GithubAuthService();
		default:
			throw new Error(`Unsupported auth service provider: ${provider}`);
	}
}

export function getUserModService(user: UserData): UserModService {
	logger.debug({ userId: user.id }, "Creating UserModService for user");
	return new UserModService(modRepository, userRepository, user);
}

export default {
	userRepository,
	modRepository,
	userService,
	getAuthService,
	getUserModService,
};
