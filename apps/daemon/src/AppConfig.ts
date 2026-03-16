import { join } from "node:path";
import { RcConfig } from "@packages/rc-config";
import { zen } from "@packages/zod/zen";
import { z } from "zod";
import { SEVEN_ZIP_BINARIES, WGET_BINARIES } from "./constants.ts";
import { which } from "./utils/which.ts";

// These constants are replaced at build time see apps/daemon/build.ts
// https://bun.com/docs/guides/runtime/build-time-constants
declare const __WEBAPP_URL: string;
declare const __DAEMON_URL: string;
declare const __WEBVIEW_WORKER_MODULE_PATH: string;
declare const __ENABLE_SERVE_DEVELOPMENT: string;
declare const __ENABLE_WEBVIEW_WORKER_DEBUG: string;
declare const __ENABLE_GENERATE_SCHEMA: string;

export const Constants = z.object({
	WebappUrl: z.url().default("http://localhost:3000/"),
	DaemonUrl: z.url().default("http://localhost:56499/"),
	WebviewWorkerModulePath: z.string().default("./src/webview/worker.ts"),
	EnableServeDevelopment: z.coerce.boolean().default(true),
	EnableWebviewWorkerDebug: z.coerce.boolean().default(true),
	EnableGenerateSchema: z.coerce.boolean().default(true),
});

export type Constants = z.infer<typeof Constants>;

export const constants = Constants.parse({
	WebappUrl: typeof __WEBAPP_URL !== "undefined" ? __WEBAPP_URL : undefined,
	DaemonUrl: typeof __DAEMON_URL !== "undefined" ? __DAEMON_URL : undefined,
	WebviewWorkerModulePath:
		typeof __WEBVIEW_WORKER_MODULE_PATH !== "undefined" ? __WEBVIEW_WORKER_MODULE_PATH : undefined,
	EnableServeDevelopment: typeof __ENABLE_SERVE_DEVELOPMENT !== "undefined" ? __ENABLE_SERVE_DEVELOPMENT : undefined,
	EnableWebviewWorkerDebug:
		typeof __ENABLE_WEBVIEW_WORKER_DEBUG !== "undefined" ? __ENABLE_WEBVIEW_WORKER_DEBUG : undefined,
	EnableGenerateSchema: typeof __ENABLE_GENERATE_SCHEMA !== "undefined" ? __ENABLE_GENERATE_SCHEMA : undefined,
});

export const AppConfig = z.object({
	host: z.ipv4(),
	port: z.number().int().min(1).max(65535),
	webappUrl: z.url(),
	daemonUrl: z.url(),

	enableServeDevelopment: z.coerce.boolean(),
	enableWebviewWorkerDebug: z.coerce.boolean(),
	enableGenerateSchema: z.coerce.boolean(),

	wgetPath: zen.path({ resolve: true, normalize: true, expandEnvVars: true }),
	sevenzipPath: zen.path({ resolve: true, normalize: true, expandEnvVars: true }),

	databasePath: zen.path({ resolve: true, normalize: true, expandEnvVars: true }),
});

export const UiAppConfig = AppConfig.pick({ webappUrl: true, daemonUrl: true });

export type AppConfig = z.infer<typeof AppConfig>;

export const appConfig = new RcConfig<AppConfig>("DropzoneDaemon", AppConfig, {
	host: "127.0.0.1",
	port: 56499,

	webappUrl: constants.WebappUrl,
	daemonUrl: constants.DaemonUrl,

	enableServeDevelopment: constants.EnableServeDevelopment,
	enableWebviewWorkerDebug: constants.EnableWebviewWorkerDebug,
	enableGenerateSchema: constants.EnableGenerateSchema,

	wgetPath: WGET_BINARIES.map(which).find(Boolean)!,
	sevenzipPath: SEVEN_ZIP_BINARIES.map(which).find(Boolean)!,

	databasePath: join(process.cwd(), "data.sqlite"),
});
