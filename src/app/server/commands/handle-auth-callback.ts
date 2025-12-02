import { getLogger } from "log4js";
import { z } from "zod";
import { AuthServiceProvider } from "../services/AuthServiceProvider.ts";

const logger = getLogger("commands/handle-auth-callback");

const InputSchema = z.object({
	provider: z.enum(AuthServiceProvider),
	code: z.string(),
	state: z.string(),
});
export type Input = z.infer<typeof InputSchema>;

export interface Deps {
	ghClientId: string;
	ghClientSecret: string;
	ghAuthorizationCallbackUrl: string;
}

export type AuthResult = {
	id: string;
	username: string;
	name?: string;
	avatarUrl: string;
	profileUrl: string;
};

export default async function (input: Input, deps: Deps): Promise<AuthResult> {
	logger.debug({ provider: input.provider }, "Handling OAuth callback: exchanging code for token");
	
	if (input.provider !== AuthServiceProvider.GITHUB) {
		throw new Error(`Unsupported auth service provider: ${input.provider}`);
	}

	const { OAuthApp, Octokit } = await import("octokit");
	const app = new OAuthApp({
		clientType: "oauth-app",
		clientId: deps.ghClientId,
		clientSecret: deps.ghClientSecret,
		redirectUrl: deps.ghAuthorizationCallbackUrl,
		allowSignup: true,
	});

	const auth = await app.createToken({ code: input.code, state: input.state });
	logger.debug("Token obtained from GitHub OAuth");

	logger.debug("Fetching authenticated user information from GitHub");
	const kit = new Octokit({ auth: auth.authentication.token });
	const { data } = await kit.rest.users.getAuthenticated();
	logger.debug(
		{ id: data.id, login: data.login },
		"Fetched authenticated GitHub user",
	);

	return {
		id: data.id.toString(),
		username: data.login,
		name: data.name ?? undefined,
		avatarUrl: data.avatar_url,
		profileUrl: data.html_url,
	};
}
