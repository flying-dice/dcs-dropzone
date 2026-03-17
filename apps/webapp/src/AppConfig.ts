import { z } from "zod";
import env from "../env.ts";
import { GithubAuthenticationProviderConfig } from "./authentication/GithubAuthenticationProvider.ts";

export const AppConfig = z.object({
	port: z.coerce.number().int().min(1).max(65535),
	mongoUri: z.string().nonempty(),
	userCookieSecret: z.string().nonempty(),
	userCookieName: z.string(),
	userCookieMaxAge: z.coerce.number().int(),
	authRedirectUrl: z.url(),
	authServiceGh: GithubAuthenticationProviderConfig.optional(),

	webappUrl: z.url(),
	daemonUrl: z.url(),

	enableServeDevelopment: z.coerce.boolean(),
	enableGenerateSchema: z.coerce.boolean(),
});

export const UiAppConfig = AppConfig.pick({ webappUrl: true, daemonUrl: true });

export type AppConfig = z.infer<typeof AppConfig>;

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
