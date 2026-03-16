import { RcConfig } from "@packages/rc-config";
import { z } from "zod";
import { GithubAuthenticationProviderConfig } from "./authentication/GithubAuthenticationProvider.ts";

// These constants are replaced at build time see apps/webapp/build.ts
// https://bun.com/docs/guides/runtime/build-time-constants
declare const __WEBAPP_URL: string;
declare const __DAEMON_URL: string;
declare const __ENABLE_SERVE_DEVELOPMENT: string;
declare const __ENABLE_UI_DEBUG: string;
declare const __ENABLE_GENERATE_SCHEMA: string;

export const Constants = z.object({
	WebappUrl: z.url().default("http://localhost:3000/"),
	DaemonUrl: z.url().default("http://localhost:56499/"),
	EnableServeDevelopment: z.coerce.boolean().default(true),
	EnableUiDebug: z.coerce.boolean().default(true),
	EnableGenerateSchema: z.coerce.boolean().default(true),
});

export type Constants = z.infer<typeof Constants>;

export const constants = Constants.parse({
	WebappUrl: typeof __WEBAPP_URL !== "undefined" ? __WEBAPP_URL : undefined,
	DaemonUrl: typeof __DAEMON_URL !== "undefined" ? __DAEMON_URL : undefined,
	EnableServeDevelopment: typeof __ENABLE_SERVE_DEVELOPMENT !== "undefined" ? __ENABLE_SERVE_DEVELOPMENT : undefined,
	EnableUiDebug: typeof __ENABLE_UI_DEBUG !== "undefined" ? __ENABLE_UI_DEBUG : undefined,
	EnableGenerateSchema: typeof __ENABLE_GENERATE_SCHEMA !== "undefined" ? __ENABLE_GENERATE_SCHEMA : undefined,
});

export const AppConfig = z.object({
	port: z.number().int().min(1).max(65535),
	mongoUri: z.string(),
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

	webappUrl: constants.WebappUrl,
	daemonUrl: constants.DaemonUrl,

	enableServeDevelopment: constants.EnableServeDevelopment,
	enableUiDebug: constants.EnableUiDebug,
	enableGenerateSchema: constants.EnableGenerateSchema,
});
