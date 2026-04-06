import { ze } from "@packages/zod/ze";
import { zen } from "@packages/zod/zen";
import { z } from "zod";

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
	DZ_DAEMON_ENABLE_WEBVIEW_WORKER_DEBUG: ze.parseBoolean(),
	DZ_ENABLE_WEBVIEW: ze.parseBoolean(),
	DZ_DAEMON_WGET_PATH: z.string().optional(),
	DZ_DAEMON_SEVENZIP_PATH: z.string().optional(),
	DZ_DAEMON_DATABASE_PATH: z.string(),
	DZ_DAEMON_WEBVIEW_WORKER_MODULE_PATH: z.string(),

	DZ_DAEMON_URL: z.url(),
	DZ_WEBAPP_URL: z.url(),
	DZ_ENABLE_SERVE_DEVELOPMENT: ze.parseBoolean(),
	DZ_ENABLE_GENERATE_SCHEMA: ze.parseBoolean(),
});

export type EnvConfig = z.infer<typeof EnvConfig>;

export const BuildConfig = EnvConfig.omit({});

export type BuildConfig = z.infer<typeof BuildConfig>;
