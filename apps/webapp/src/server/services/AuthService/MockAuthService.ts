import { getLogger } from "log4js";
import appConfig from "../../ApplicationConfig.ts";
import type { AuthResult, AuthService } from "./AuthService.ts";

const logger = getLogger("MockAuthService");

/**
 * Mock authentication service for testing without real OAuth.
 * Always returns the same mock user regardless of callback parameters.
 */
export class MockAuthService implements AuthService {
	private readonly mockUser: AuthResult = {
		id: "mock-user-123",
		username: "mockuser",
		name: "Mock User",
		avatarUrl: "https://avatars.githubusercontent.com/u/1?v=4",
		profileUrl: "https://github.com/mockuser",
	};

	constructor() {
		logger.info("MockAuthService initialized - authentication is disabled");
	}

	getWebFlowAuthorizationUrl(): string {
		logger.debug("Mock auth: generating authorization URL (redirecting to homepage)");
		// Redirect to homepage since there's no real OAuth flow
		return appConfig.ghHomepageUrl ?? "http://localhost:3000";
	}

	async handleCallback(_code: string, _state: string): Promise<AuthResult> {
		logger.debug("Mock auth: handling callback - returning mock user");
		return this.mockUser;
	}
}
