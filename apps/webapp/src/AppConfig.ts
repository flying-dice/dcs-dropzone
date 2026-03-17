import { env } from "@packages/dz-config";
import { z } from "zod";
import { GithubAuthenticationProviderConfig } from "./authentication/GithubAuthenticationProvider.ts";

export const AppConfig = z.object({
	port: z.coerce.number().int().min(1).max(65535).default(3000),
	mongoUri: z.string().nonempty(),
	userCookieSecret: z.string().nonempty(),
	userCookieName: z.string().default("USERID"),
	userCookieMaxAge: z.coerce.number().int().default(86400),
	authRedirectUrl: z.url(),
	authServiceGh: GithubAuthenticationProviderConfig.optional(),

	webappUrl: z.url().default("http://localhost:3000/"),
	daemonUrl: z.url().default("http://localhost:56499/"),

	enableServeDevelopment: z.coerce.boolean().default(true),
	enableUiDebug: z.coerce.boolean().default(true),
	enableGenerateSchema: z.coerce.boolean().default(true),
});

export const UiAppConfig = AppConfig.pick({ enableUiDebug: true, webappUrl: true, daemonUrl: true });

export type AppConfig = z.infer<typeof AppConfig>;

export const appConfig = AppConfig.parse({
	port: env.DZ_PORT,
	mongoUri: env.DZ_MONGO_URI,
	userCookieSecret: env.DZ_USER_COOKIE_SECRET,
	userCookieName: env.DZ_USER_COOKIE_NAME,
	userCookieMaxAge: env.DZ_USER_COOKIE_MAX_AGE,
	authRedirectUrl: env.DZ_AUTH_REDIRECT_URL ?? env.DZ_WEBAPP_URL,

	authServiceGh: env.DZ_AUTH_SERVICE_GH ? JSON.parse(env.DZ_AUTH_SERVICE_GH) : undefined,

	webappUrl: env.DZ_WEBAPP_URL,
	daemonUrl: env.DZ_DAEMON_URL,

	enableServeDevelopment: env.DZ_ENABLE_SERVE_DEVELOPMENT,
	enableUiDebug: env.DZ_ENABLE_UI_DEBUG,
	enableGenerateSchema: env.DZ_ENABLE_GENERATE_SCHEMA,
});
