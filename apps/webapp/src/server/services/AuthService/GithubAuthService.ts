import { getLogger } from "log4js";
import { OAuthApp, Octokit } from "octokit";
import { z } from "zod";
import type { AuthResult, AuthService } from "./AuthService.ts";

const logger = getLogger("GithubAuthService");

export const GithubAuthServiceConfig = z.object({
	enabled: z.boolean(),
	clientId: z.string(),
	clientSecret: z.string(),
	redirectUrl: z.url(),
});

export type GithubAuthServiceConfig = z.infer<typeof GithubAuthServiceConfig>;

export class GithubAuthService implements AuthService {
	private readonly app: OAuthApp;

	constructor(config: GithubAuthServiceConfig) {
		const { clientId, clientSecret, redirectUrl } = GithubAuthServiceConfig.parse(config);

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
