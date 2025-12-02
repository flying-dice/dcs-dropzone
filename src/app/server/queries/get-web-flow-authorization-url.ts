import { getLogger } from "log4js";
import { z } from "zod";
import { AuthServiceProvider } from "../services/AuthServiceProvider.ts";

const logger = getLogger("queries/get-web-flow-authorization-url");

const InputSchema = z.object({
	provider: z.enum(AuthServiceProvider),
});
export type Input = z.infer<typeof InputSchema>;

export interface Deps {
	ghClientId: string;
	ghClientSecret: string;
	ghAuthorizationCallbackUrl: string;
}

export default async function (input: Input, deps: Deps): Promise<string> {
	logger.debug({ provider: input.provider }, "Generating web flow authorization URL");
	
	if (input.provider !== AuthServiceProvider.GITHUB) {
		throw new Error(`Unsupported auth service provider: ${input.provider}`);
	}

	const { OAuthApp } = await import("octokit");
	const app = new OAuthApp({
		clientType: "oauth-app",
		clientId: deps.ghClientId,
		clientSecret: deps.ghClientSecret,
		redirectUrl: deps.ghAuthorizationCallbackUrl,
		allowSignup: true,
	});

	return app.getWebFlowAuthorizationUrl({}).url;
}
