import { GithubAuthService } from "../services/impl/GithubAuthService.ts";

export enum AuthServiceProvider {
	GITHUB = "github",
}

export class AuthServiceFactory {
	static getAuthService(provider: AuthServiceProvider) {
		switch (provider) {
			case AuthServiceProvider.GITHUB:
				return new GithubAuthService();
			default:
				throw new Error(`Unsupported auth service provider: ${provider}`);
		}
	}
}
