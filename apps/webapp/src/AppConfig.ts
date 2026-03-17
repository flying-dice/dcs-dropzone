import { RcConfig } from "@packages/rc-config";
import { z } from "zod";
import { GithubAuthenticationProviderConfig } from "./authentication/GithubAuthenticationProvider.ts";
import { env } from "../env.ts";

export const Constants = z.object({
	WebappUrl: z.url().default("http://localhost:3000/"),
	DaemonUrl: z.url().default("http://localhost:56499/"),
	EnableServeDevelopment: z.coerce.boolean().default(true),
	EnableUiDebug: z.coerce.boolean().default(true),
	EnableGenerateSchema: z.coerce.boolean().default(true),
});

export type Constants = z.infer<typeof Constants>;

export const constants = Constants.parse({
	WebappUrl: env.DZ_WEBAPP_URL,
	DaemonUrl: env.DZ_DAEMON_URL,
	EnableServeDevelopment: env.DZ_ENABLE_SERVE_DEVELOPMENT,
	EnableUiDebug: env.DZ_ENABLE_UI_DEBUG,
	EnableGenerateSchema: env.DZ_ENABLE_GENERATE_SCHEMA,
});

export const AppConfig = z.object({
	port: z.number().int().min(1).max(65535),
	mongoUri: z.string().nonempty(),
	userCookieSecret: z.string().nonempty(),
	userCookieName: z.string(),
	userCookieMaxAge: z.number().int(),
	authRedirectUrl: z.url(),
	authServiceGh: GithubAuthenticationProviderConfig.optional(),

	webappUrl: z.url(),
	daemonUrl: z.url(),

	enableServeDevelopment: z.coerce.boolean(),
	enableUiDebug: z.coerce.boolean(),
	enableGenerateSchema: z.coerce.boolean(),
});

export const UiAppConfig = AppConfig.pick({ enableUiDebug: true, webappUrl: true, daemonUrl: true });

export type AppConfig = z.infer<typeof AppConfig>;

export const appConfig = new RcConfig<AppConfig>("DropzoneWebapp", AppConfig, {
	port: 3000,
	userCookieName: "USERID",
	userCookieMaxAge: 86400,
	authRedirectUrl: constants.WebappUrl,

	userCookieSecret: undefined,
	mongoUri: undefined,

	webappUrl: constants.WebappUrl,
	daemonUrl: constants.DaemonUrl,

	enableServeDevelopment: constants.EnableServeDevelopment,
	enableUiDebug: constants.EnableUiDebug,
	enableGenerateSchema: constants.EnableGenerateSchema,
});
