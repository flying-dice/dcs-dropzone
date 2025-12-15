import { getLogger } from "log4js";
import appConfig from "../../ApplicationConfig.ts";
import { AuthServiceProvider } from "./AuthServiceProvider.ts";
import { GithubAuthService } from "./GithubAuthService.ts";
import { MockAuthService } from "./MockAuthService.ts";

const logger = getLogger("AuthServiceFactory");

let githubAuthServiceInstance: GithubAuthService | null = null;
const mockAuthServiceInstance = new MockAuthService();

export const AuthServiceFactory = {
	getAuthService(provider: AuthServiceProvider) {
		logger.debug({ provider, authDisabled: appConfig.authDisabled }, "Selecting AuthService provider");

		// Short-circuit to mock auth if disabled
		if (appConfig.authDisabled) {
			logger.debug("Auth is disabled - using MockAuthService");
			return mockAuthServiceInstance;
		}

		// Lazy initialize GitHub service only when auth is enabled
		if (!githubAuthServiceInstance) {
			githubAuthServiceInstance = new GithubAuthService();
		}

		switch (provider) {
			case AuthServiceProvider.GITHUB:
				return githubAuthServiceInstance;
			default:
				throw new Error(`Unsupported auth service provider: ${provider}`);
		}
	},
};
