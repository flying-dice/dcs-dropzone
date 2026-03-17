import { zen } from "@packages/zod/zen";
import { z } from "zod";
import env from "../env.ts";
import { SEVEN_ZIP_BINARIES, WGET_BINARIES } from "./constants.ts";
import { which } from "./utils/which.ts";

export const AppConfig = z.object({
	host: z.ipv4(),
	port: z.number().int().min(1).max(65535),
	webappUrl: z.url(),
	daemonUrl: z.url(),
	webviewWindowTitle: z.string(),

	enableServeDevelopment: z.boolean(),
	enableWebviewWorkerDebug: z.boolean(),
	enableGenerateSchema: z.boolean(),

	wgetPath: zen.path({ resolve: true, normalize: true, expandEnvVars: true }),
	sevenzipPath: zen.path({ resolve: true, normalize: true, expandEnvVars: true }),

	databasePath: zen.path({ resolve: true, normalize: true, expandEnvVars: true }),

	webviewWorkerModulePath: z.string(),
});

export const UiAppConfig = AppConfig.pick({ webappUrl: true, daemonUrl: true });

export type AppConfig = z.infer<typeof AppConfig>;

export const appConfig = AppConfig.parse({
	host: env.DZ_DAEMON_HOST,
	port: env.DZ_DAEMON_PORT,
	webappUrl: env.DZ_WEBAPP_URL,
	daemonUrl: env.DZ_DAEMON_URL,
	webviewWindowTitle: env.DZ_DAEMON_WEBVIEW_WINDOW_TITLE,

	enableServeDevelopment: env.DZ_ENABLE_SERVE_DEVELOPMENT,
	enableWebviewWorkerDebug: env.DZ_DAEMON_ENABLE_WEBVIEW_WORKER_DEBUG,
	enableGenerateSchema: env.DZ_ENABLE_GENERATE_SCHEMA,

	wgetPath: env.DZ_DAEMON_WGET_PATH ?? WGET_BINARIES.map(which).find(Boolean),
	sevenzipPath: env.DZ_DAEMON_SEVENZIP_PATH ?? SEVEN_ZIP_BINARIES.map(which).find(Boolean),

	databasePath: env.DZ_DAEMON_DATABASE_PATH,

	webviewWorkerModulePath: env.DZ_DAEMON_WEBVIEW_WORKER_MODULE_PATH,
});
