import { z } from "zod";
import { GithubAuthenticationProviderConfig } from "../authentication/GithubAuthenticationProvider.ts";

/**
 * envBoolean uses Boolean(value) which treats any non-empty string as
 * true — including "false" and "0". This helper handles string env vars correctly.
 */
const envBoolean = z.preprocess(
	(v) => (typeof v === "string" ? v === "true" || v === "1" : v),
	envBoolean,
);

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

	enableServeDevelopment: envBoolean,
	enableGenerateSchema: envBoolean,
});

export const UiAppConfig = AppConfig.pick({ webappUrl: true, daemonUrl: true });

export type AppConfig = z.infer<typeof AppConfig>;

export const EnvConfig = z.object({
	DZ_WEBAPP_PORT: z.coerce.number().int().min(1).max(65535),
	DZ_WEBAPP_MONGO_URI: z.string().nonempty(),
	DZ_WEBAPP_USER_COOKIE_NAME: z.string().nonempty(),
	DZ_WEBAPP_USER_COOKIE_SECRET: z.string().nonempty(),
	DZ_WEBAPP_USER_COOKIE_MAX_AGE: z.coerce.number().int(),
	DZ_WEBAPP_AUTH_REDIRECT_URL: z.url(),

	DZ_WEBAPP_AUTH_SERVICE_GH: z.string().optional(),

	DZ_DAEMON_URL: z.url(),
	DZ_WEBAPP_URL: z.url(),

	DZ_ENABLE_SERVE_DEVELOPMENT: envBoolean,
	DZ_ENABLE_GENERATE_SCHEMA: envBoolean,
});

export type EnvConfig = z.infer<typeof EnvConfig>;

export const BuildConfig = EnvConfig.omit({
	DZ_WEBAPP_MONGO_URI: true,
	DZ_WEBAPP_USER_COOKIE_SECRET: true,
	DZ_WEBAPP_AUTH_REDIRECT_URL: true,
	DZ_WEBAPP_AUTH_SERVICE_GH: true,
	DZ_WEBAPP_URL: true,
});

export type BuildConfig = z.infer<typeof BuildConfig>;
