import { zen } from "@packages/zod/zen";
import { z } from "zod";

/**
 * z.coerce.boolean() uses Boolean(value) which treats any non-empty string as
 * true — including "false" and "0". This helper handles string env vars correctly.
 */
const envBoolean = z.preprocess((v) => (typeof v === "string" ? v === "true" || v === "1" : v), z.coerce.boolean());

export const AppConfig = z.object({
	host: z.ipv4(),
	port: z.number().int().min(1).max(65535),
	webappUrl: z.url(),
	daemonUrl: z.url(),
	webviewWindowTitle: z.string(),

	enableServeDevelopment: z.boolean(),
	enableWebviewWorkerDebug: z.boolean(),
	enableWebview: z.boolean(),
	enableGenerateSchema: z.boolean(),

	wgetPath: zen.path({ resolve: true, normalize: true, expandEnvVars: true }),
	sevenzipPath: zen.path({ resolve: true, normalize: true, expandEnvVars: true }),

	databasePath: zen.path({ resolve: false, normalize: true, expandEnvVars: true }),

	webviewWorkerModulePath: z.string(),
});

export const UiAppConfig = AppConfig.pick({ webappUrl: true, daemonUrl: true });

export type AppConfig = z.infer<typeof AppConfig>;

export const EnvConfig = z.object({
	DZ_DAEMON_HOST: z.ipv4(),
	DZ_DAEMON_PORT: z.coerce.number().int().min(1).max(65535),
	DZ_DAEMON_WEBVIEW_WINDOW_TITLE: z.string(),
	DZ_DAEMON_ENABLE_WEBVIEW_WORKER_DEBUG: envBoolean,
	DZ_ENABLE_WEBVIEW: envBoolean,
	DZ_DAEMON_WGET_PATH: z.string().optional(),
	DZ_DAEMON_SEVENZIP_PATH: z.string().optional(),
	DZ_DAEMON_DATABASE_PATH: z.string(),
	DZ_DAEMON_WEBVIEW_WORKER_MODULE_PATH: z.string(),

	DZ_DAEMON_URL: z.url(),
	DZ_WEBAPP_URL: z.url(),
	DZ_ENABLE_SERVE_DEVELOPMENT: envBoolean,
	DZ_ENABLE_GENERATE_SCHEMA: envBoolean,
});

export type EnvConfig = z.infer<typeof EnvConfig>;

export const BuildConfig = EnvConfig.omit({});

export type BuildConfig = z.infer<typeof BuildConfig>;
