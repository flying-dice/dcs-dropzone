import { OAuthApp, Octokit } from "octokit";
import appConfig from "../ApplicationConfig.ts";
import type { AuthResult, AuthService } from "./AuthService.ts";

export class GithubAuthService implements AuthService {
	private readonly app: OAuthApp;

	constructor() {
		this.app = new OAuthApp({
			clientType: "oauth-app",
			clientId: appConfig.ghClientId,
			clientSecret: appConfig.ghClientSecret,
			redirectUrl: appConfig.ghAuthorizationCallbackUrl,
			allowSignup: true,
		});
	}

	getWebFlowAuthorizationUrl() {
		return this.app.getWebFlowAuthorizationUrl({}).url;
	}

	async handleCallback(code: string, state: string): Promise<AuthResult> {
		const auth = await this.app.createToken({ code, state });

		const kit = new Octokit({ auth: auth.authentication.token });
		const { data } = await kit.rest.users.getAuthenticated();

		return {
			id: data.id.toString(),
			username: data.login,
			name: data.name ?? undefined,
			avatarUrl: data.avatar_url,
			profileUrl: data.html_url,
		};
	}
}
