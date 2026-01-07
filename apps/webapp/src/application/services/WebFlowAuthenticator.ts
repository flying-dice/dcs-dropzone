import type { AuthenticationProvider, AuthResult } from "../ports/AuthenticationProvider.ts";
import type { UserData } from "../schemas/UserData.ts";
import type { Users } from "./Users.ts";

type Deps = {
	authProvider: AuthenticationProvider;
	users: Users;
};

export class WebFlowAuthenticator {
	constructor(protected readonly deps: Deps) {}

	getWebFlowAuthorizationUrl(): string {
		return this.deps.authProvider.getWebFlowAuthorizationUrl();
	}

	async handleAuthCallback(code: string, state: string): Promise<AuthResult> {
		return this.deps.authProvider.handleCallback(code, state);
	}

	async handleAuthResult(authResult: AuthResult): Promise<UserData> {
		return this.deps.users.createFromAuthResult(authResult);
	}
}
