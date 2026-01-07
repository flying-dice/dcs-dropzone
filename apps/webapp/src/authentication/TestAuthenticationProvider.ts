import type { AuthenticationProvider, AuthResult } from "./AuthenticationProvider.ts";

/**
 * Test double for AuthenticationProvider port.
 */
export class TestAuthenticationProvider implements AuthenticationProvider {
	private nextAuthResult: AuthResult = {
		id: "test-user-id",
		username: "testuser",
		name: "Test User",
		avatarUrl: "https://example.com/avatar.png",
		profileUrl: "https://example.com/profile",
	};

	setNextAuthResult(result: AuthResult): void {
		this.nextAuthResult = result;
	}

	getWebFlowAuthorizationUrl(): string {
		return "/auth/test/callback?code=testcode&state=teststate";
	}

	async handleCallback(_code: string, _state: string): Promise<AuthResult> {
		return this.nextAuthResult;
	}
}
