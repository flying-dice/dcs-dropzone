import Database from "./Database.ts";
import Logger from "./Logger.ts";
import { MongoModRepository } from "./repository/impl/MongoModRepository.ts";
import { MongoModSummaryRepository } from "./repository/impl/MongoModSummaryRepository.ts";
import { MongoUserRepository } from "./repository/impl/MongoUserRepository.ts";
import type { ModRepository } from "./repository/ModRepository.ts";
import type { ModSummaryRepository } from "./repository/ModSummaryRepository.ts";
import type { UserRepository } from "./repository/UserRepository.ts";
import type { UserData } from "./schemas/UserData.ts";
import type { AuthService } from "./services/AuthService.ts";
import { AuthServiceProvider } from "./services/AuthServiceProvider.ts";
import { GithubAuthService } from "./services/GithubAuthService.ts";
import { ModService } from "./services/ModService.ts";
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

const modSummaryRepository: ModSummaryRepository =
	new MongoModSummaryRepository(Database.instance);
await modSummaryRepository.postConstruct();

logger.debug("Repositories initialized");

logger.debug("Initializing services");
const userService: UserService = new UserService(userRepository);
const modService: ModService = new ModService(
	modRepository,
	modSummaryRepository,
);
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
	modService,
	getAuthService,
	getUserModService,
};
