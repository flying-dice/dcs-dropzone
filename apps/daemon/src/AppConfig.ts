import { join } from "node:path";
import { RcConfig, env } from "@packages/dz-config";
import { zen } from "@packages/zod/zen";
import { z } from "zod";
import { SEVEN_ZIP_BINARIES, WGET_BINARIES } from "./constants.ts";
import { which } from "./utils/which.ts";

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
	WebappUrl: env.DZ_WEBAPP_URL,
	DaemonUrl: env.DZ_DAEMON_URL,
	WebviewWorkerModulePath: env.DZ_WEBVIEW_WORKER_MODULE_PATH,
	EnableServeDevelopment: env.DZ_ENABLE_SERVE_DEVELOPMENT,
	EnableWebviewWorkerDebug: env.DZ_ENABLE_WEBVIEW_WORKER_DEBUG,
	EnableGenerateSchema: env.DZ_ENABLE_GENERATE_SCHEMA,
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
