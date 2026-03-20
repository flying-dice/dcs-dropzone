import { BuildEnv } from "@packages/dz-config";
import { AppConfig, BuildConfig, EnvConfig } from "./schemas.ts";

export { UiAppConfig } from "./schemas.ts";

const buildEnv: BuildConfig | undefined = BuildEnv.load(BuildConfig);
const env: EnvConfig = EnvConfig.parse({ ...buildEnv, ...process.env });

export const appConfig = AppConfig.parse({
	port: env.DZ_WEBAPP_PORT,
	mongoUri: env.DZ_WEBAPP_MONGO_URI,
	userCookieSecret: env.DZ_WEBAPP_USER_COOKIE_SECRET,
	userCookieName: env.DZ_WEBAPP_USER_COOKIE_NAME,
	userCookieMaxAge: env.DZ_WEBAPP_USER_COOKIE_MAX_AGE,
	authRedirectUrl: env.DZ_WEBAPP_AUTH_REDIRECT_URL,

	authServiceGh: env.DZ_WEBAPP_AUTH_SERVICE_GH ? JSON.parse(env.DZ_WEBAPP_AUTH_SERVICE_GH) : undefined,

	webappUrl: env.DZ_WEBAPP_URL,
	daemonUrl: env.DZ_DAEMON_URL,

	enableServeDevelopment: env.DZ_ENABLE_SERVE_DEVELOPMENT,
	enableGenerateSchema: env.DZ_ENABLE_GENERATE_SCHEMA,
});
