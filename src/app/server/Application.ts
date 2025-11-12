import Logger from "./Logger.ts";
import { server } from "./Server.ts";
import type { UserData } from "./schemas/UserData.ts";
import type { AuthService } from "./services/AuthService.ts";
import { AuthServiceProvider } from "./services/AuthServiceProvider.ts";
import { GithubAuthService } from "./services/GithubAuthService.ts";
import { ModService } from "./services/ModService.ts";
import { UserModService } from "./services/UserModService.ts";
import { UserService } from "./services/UserService.ts";
import { UserTokenService } from "./services/UserTokenService.ts";

const logger = Logger.getLogger("ApplicationContext");

logger.debug("Initializing services");
const userTokenService: UserTokenService = new UserTokenService();
const userService: UserService = new UserService(userTokenService);
const modService: ModService = new ModService();
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
	return new UserModService(user);
}

export default {
	server,
	userService,
	modService,
	getAuthService,
	getUserModService,
};
