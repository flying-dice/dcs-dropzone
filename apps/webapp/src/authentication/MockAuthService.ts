import { getLogger } from "log4js";
import type { AuthenticationProvider, AuthResult } from "./AuthenticationProvider.ts";

const logger = getLogger("MockAuthService");

/**
 * Mock authentication service for testing without real OAuth.
 * Always returns the same mock user regardless of callback parameters.
 */
export class MockAuthService implements AuthenticationProvider {
	private readonly mockUser: AuthResult = {
		id: "0",
		username: "mockuser",
		name: "Mock User",
		avatarUrl: "https://avatars.githubusercontent.com/u/0",
		profileUrl: "https://github.com",
	};

	constructor() {
		logger.info("MockAuthService initialized - authentication is disabled");
	}

	getWebFlowAuthorizationUrl(): string {
		logger.debug("Mock auth: generating authorization URL (redirecting to homepage)");
		// Redirect to the homepage since there's no real OAuth flow
		return "/auth/callback?code=mockcode&state=mockstate";
	}

	async handleCallback(_code: string, _state: string): Promise<AuthResult> {
		logger.debug("Mock auth: handling callback - returning mock user");
		return this.mockUser;
	}
}
