import Database from "./Database.ts";
import { MongoModRepository } from "./repsotiory/impl/MongoModRepository.ts";
import { MongoUserRepository } from "./repsotiory/impl/MongoUserRepository.ts";
import type { ModRepository } from "./repsotiory/ModRepository.ts";
import type { UserRepository } from "./repsotiory/UserRepository.ts";
import type { UserData } from "./schemas/UserData.ts";
import type { AuthService } from "./services/AuthService.ts";
import { AuthServiceProvider } from "./services/AuthServiceProvider.ts";
import { GithubAuthService } from "./services/GithubAuthService.ts";
import { UserModService } from "./services/UserModService.ts";
import { UserService } from "./services/UserService.ts";

const userRepository: UserRepository = new MongoUserRepository(
	Database.instance,
);
await userRepository.postConstruct();
const modRepository: ModRepository = new MongoModRepository(Database.instance);
await modRepository.postConstruct();
export const userService: UserService = new UserService(userRepository);

export function getAuthService(provider: AuthServiceProvider): AuthService {
	switch (provider) {
		case AuthServiceProvider.GITHUB:
			return new GithubAuthService();
		default:
			throw new Error(`Unsupported auth service provider: ${provider}`);
	}
}

export function getUserModService(user: UserData): UserModService {
	return new UserModService(modRepository, userRepository, user);
}

export default {
	userRepository,
	modRepository,
	userService,
	getAuthService,
	getUserModService,
};
