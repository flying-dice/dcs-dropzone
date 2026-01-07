import { getLogger } from "log4js";
import { OAuthApp, Octokit } from "octokit";
import { z } from "zod";
import type { AuthenticationProvider, AuthResult } from "../application/ports/AuthenticationProvider.ts";

const logger = getLogger("GithubAuthenticationProvider");

export const GithubAuthenticationProviderConfig = z.object({
	clientId: z.string(),
	clientSecret: z.string(),
	redirectUrl: z.url(),
});

export type GithubAuthenticationProviderConfig = z.infer<typeof GithubAuthenticationProviderConfig>;

export class GithubAuthenticationProvider implements AuthenticationProvider {
	private readonly app: OAuthApp;

	constructor(config: GithubAuthenticationProviderConfig) {
		const { clientId, clientSecret, redirectUrl } = GithubAuthenticationProviderConfig.parse(config);

		this.app = new OAuthApp({
			clientType: "oauth-app",
			clientId,
			clientSecret,
			redirectUrl,
			allowSignup: true,
		});
	}

	getWebFlowAuthorizationUrl() {
		logger.debug("Generating web flow authorization URL");
		return this.app.getWebFlowAuthorizationUrl({}).url;
	}

	async handleCallback(code: string, state: string): Promise<AuthResult> {
		logger.debug("Handling OAuth callback: exchanging code for token");
		const auth = await this.app.createToken({ code, state });
		logger.debug("Token obtained from GitHub OAuth");

		logger.debug("Fetching authenticated user information from GitHub");
		const kit = new Octokit({ auth: auth.authentication.token });
		const { data } = await kit.rest.users.getAuthenticated();
		logger.debug({ id: data.id, login: data.login }, "Fetched authenticated GitHub user");

		return {
			id: data.id.toString(),
			username: data.login,
			name: data.name ?? undefined,
			avatarUrl: data.avatar_url,
			profileUrl: data.html_url,
		};
	}
}
