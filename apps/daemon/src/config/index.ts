import { BuildEnv } from "@packages/dz-config";
import { SEVEN_ZIP_BINARIES, WGET_BINARIES } from "../constants.ts";
import { which } from "../utils/which.ts";
import { AppConfig, BuildConfig, EnvConfig } from "./schemas.ts";

const buildEnv: BuildConfig | undefined = BuildEnv.load(BuildConfig);
const env: EnvConfig = EnvConfig.parse({ ...buildEnv, ...process.env });

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
