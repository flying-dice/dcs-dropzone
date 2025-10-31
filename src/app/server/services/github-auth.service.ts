import { SignJWT } from "jose";
import { OAuthApp, Octokit } from "octokit";
import appConfig from "../app-config.ts";
import type { AuthService, UserData } from "./auth.service.ts";

export class GithubAuthService implements AuthService {
	private readonly app: OAuthApp;

	private readonly encodedSecret: Uint8Array<ArrayBufferLike>;

	constructor() {
		this.encodedSecret = new TextEncoder().encode(appConfig.jwtSecret);
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

	async handleCallback(
		code: string,
		state: string,
	): Promise<{ user: UserData; token: string }> {
		console.log({ code, state });
		const auth = await this.app.createToken({ code, state });
		console.log(auth);

		const kit = new Octokit({ auth: auth.authentication.token });
		const { data } = await kit.rest.users.getAuthenticated();

		const user: UserData = {
			userId: data.id.toString(),
			userLogin: data.login,
			userName: data.name ?? undefined,
			userAvatarUrl: data.avatar_url,
			userProfileUrl: data.html_url,
		};

		const token = await new SignJWT(user)
			.setProtectedHeader({ alg: "HS256" })
			.sign(this.encodedSecret);

		return { user, token };
	}
}

export const githubAuthService = new GithubAuthService();
