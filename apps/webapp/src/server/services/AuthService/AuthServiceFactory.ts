import { getLogger } from "log4js";
import applicationConfig from "../../ApplicationConfig.ts";
import { AuthServiceProvider } from "./AuthServiceProvider.ts";
import { GithubAuthService } from "./GithubAuthService.ts";
import { MockAuthService } from "./MockAuthService.ts";

const logger = getLogger("AuthServiceFactory");

const githubAuthServiceInstance: GithubAuthService | null = applicationConfig.authServiceGh?.enabled
	? new GithubAuthService(applicationConfig.authServiceGh)
	: null;

const mockAuthServiceInstance: MockAuthService | null = applicationConfig.authServiceMock?.enabled
	? new MockAuthService(applicationConfig.authServiceMock)
	: null;

if (!githubAuthServiceInstance && !mockAuthServiceInstance) {
	logger.error(
		"Startup failed due to missing authentication configuration. At least one auth service is required. For development/testing, enable the Mock Auth Service: AUTH_SERVICE_MOCK='{\"enabled\": true}'",
	);

	throw new Error("NO_AUTH_SERVICE");
}

export const AuthServiceFactory = {
	getAuthService(provider: AuthServiceProvider) {
		if (provider === AuthServiceProvider.GITHUB && githubAuthServiceInstance) {
			return githubAuthServiceInstance;
		}

		if (mockAuthServiceInstance) {
			logger.warn("Using Mock Auth Service - not suitable for production!");
			return mockAuthServiceInstance;
		}

		throw new Error(`No Auth Service configured for provider: ${provider}`);
	},
};
