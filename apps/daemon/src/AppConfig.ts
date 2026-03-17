import { join } from "node:path";
import { env } from "@packages/dz-config";
import { zen } from "@packages/zod/zen";
import { z } from "zod";
import { SEVEN_ZIP_BINARIES, WGET_BINARIES } from "./constants.ts";
import { which } from "./utils/which.ts";

export const AppConfig = z.object({
	host: z.ipv4().default("127.0.0.1"),
	port: z.coerce.number().int().min(1).max(65535).default(56499),
	webappUrl: z.url().default("http://localhost:3000/"),
	daemonUrl: z.url().default("http://localhost:56499/"),

	enableServeDevelopment: z.coerce.boolean().default(true),
	enableWebviewWorkerDebug: z.coerce.boolean().default(true),
	enableGenerateSchema: z.coerce.boolean().default(true),

	wgetPath: zen.path({ resolve: true, normalize: true, expandEnvVars: true }),
	sevenzipPath: zen.path({ resolve: true, normalize: true, expandEnvVars: true }),

	databasePath: zen
		.path({ resolve: true, normalize: true, expandEnvVars: true })
		.default(join(process.cwd(), "data.sqlite")),

	webviewWorkerModulePath: z.string().default("./src/webview/worker.ts"),
});

export const UiAppConfig = AppConfig.pick({ webappUrl: true, daemonUrl: true });

export type AppConfig = z.infer<typeof AppConfig>;

export const appConfig = AppConfig.parse({
	host: env.DZ_HOST,
	port: env.DZ_PORT,
	webappUrl: env.DZ_WEBAPP_URL,
	daemonUrl: env.DZ_DAEMON_URL,

	enableServeDevelopment: env.DZ_ENABLE_SERVE_DEVELOPMENT,
	enableWebviewWorkerDebug: env.DZ_ENABLE_WEBVIEW_WORKER_DEBUG,
	enableGenerateSchema: env.DZ_ENABLE_GENERATE_SCHEMA,

	wgetPath: env.DZ_WGET_PATH ?? WGET_BINARIES.map(which).find(Boolean),
	sevenzipPath: env.DZ_SEVENZIP_PATH ?? SEVEN_ZIP_BINARIES.map(which).find(Boolean),

	databasePath: env.DZ_DATABASE_PATH,

	webviewWorkerModulePath: env.DZ_WEBVIEW_WORKER_MODULE_PATH,
});
