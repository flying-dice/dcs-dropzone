import { createFactory } from "hono/factory";
import { getLogger } from "log4js";
import { appConfig } from "../config";
import { ProdApplication } from "../ProdApplication.ts";

const logger = getLogger("ApplicationFactory");

type Env = {
	Variables: {
		app: ProdApplication;
	};
};

logger.debug("Creating ProdApplication instance...");
export const application = new ProdApplication({
	databaseUrl: appConfig.databasePath,
	wgetExecutablePath: appConfig.wgetPath,
	sevenZipExecutablePath: appConfig.sevenzipPath,
});

export default createFactory<Env>({
	initApp: (app) => {
		app.use(async (c, next) => {
			c.set("app", application);
			await next();
		});
	},
});
