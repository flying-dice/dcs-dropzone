import { getLogger } from "log4js";
import { server } from "./Server.ts";
import type { AuthService } from "./services/AuthService.ts";
import { AuthServiceProvider } from "./services/AuthServiceProvider.ts";
import { GithubAuthService } from "./services/GithubAuthService.ts";

const logger = getLogger("Application");

export function getAuthService(provider: AuthServiceProvider): AuthService {
	logger.debug({ provider }, "Selecting AuthService provider");
	switch (provider) {
		case AuthServiceProvider.GITHUB:
			return new GithubAuthService();
		default:
			throw new Error(`Unsupported auth service provider: ${provider}`);
	}
}

export default {
	server,
	getAuthService,
};
