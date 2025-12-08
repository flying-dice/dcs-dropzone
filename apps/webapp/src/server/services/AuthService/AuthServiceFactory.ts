import { getLogger } from "log4js";
import { AuthServiceProvider } from "./AuthServiceProvider.ts";
import { GithubAuthService } from "./GithubAuthService.ts";

const logger = getLogger("AuthServiceFactory");

const githubAuthServiceInstance = new GithubAuthService();

export const AuthServiceFactory = {
	getAuthService(provider: AuthServiceProvider) {
		logger.debug({ provider }, "Selecting AuthService provider");
		switch (provider) {
			case AuthServiceProvider.GITHUB:
				return githubAuthServiceInstance;
			default:
				throw new Error(`Unsupported auth service provider: ${provider}`);
		}
	},
};
