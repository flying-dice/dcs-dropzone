import { createFactory } from "hono/factory";
import { getLogger } from "log4js";
import type { UserData } from "../application/schemas/UserData.ts";
import type { AuthenticationProvider } from "../authentication/AuthenticationProvider.ts";
import { GithubAuthenticationProvider } from "../authentication/GithubAuthenticationProvider.ts";
import { MockAuthService } from "../authentication/MockAuthService.ts";
import { appConfig } from "../config";
import { ProdApplication } from "../ProdApplication.ts";

const logger = getLogger("ApplicationFactory");

type Env = {
	Variables: {
		app: ProdApplication;
		getUser: () => UserData;
	};
};

logger.debug("Creating ProdApplication instance...");
export const application = new ProdApplication({ mongoUri: appConfig.mongoUri });

logger.debug("Creating AuthenticationProvider...");
export const authProvider: AuthenticationProvider = appConfig.authServiceGh
	? new GithubAuthenticationProvider(appConfig.authServiceGh)
	: new MockAuthService();

export default createFactory<Env>({
	initApp: (app) => {
		app.use(async (c, next) => {
			c.set("app", application);
			await next();
		});
	},
});
