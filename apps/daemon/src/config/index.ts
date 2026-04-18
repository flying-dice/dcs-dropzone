import { BuildEnv } from "@packages/dz-config";
import { getLogger } from "log4js";
import { SEVEN_ZIP_BINARIES, WGET_BINARIES } from "../constants.ts";
import { which } from "../utils/which.ts";
import { AppConfig, BuildConfig, EnvConfig } from "./schemas.ts";

const logger = getLogger("config");

const buildEnv: BuildConfig | undefined = BuildEnv.load(BuildConfig);
const env: EnvConfig = EnvConfig.parse({ ...buildEnv, ...process.env });

const wgetPath = env.DZ_DAEMON_WGET_PATH ?? WGET_BINARIES.map(which).find(Boolean);
const sevenzipPath = env.DZ_DAEMON_SEVENZIP_PATH ?? SEVEN_ZIP_BINARIES.map(which).find(Boolean);

if (!wgetPath) {
	logger.fatal(
		`wget not found. Searched for: ${WGET_BINARIES.join(", ")}.\n` +
			"Please install wget or set DZ_DAEMON_WGET_PATH to the path of your wget executable.",
	);
	process.exit(1);
}

if (!sevenzipPath) {
	logger.fatal(
		`7-Zip not found. Searched for: ${SEVEN_ZIP_BINARIES.join(", ")}.\n` +
			"Please install 7-Zip or set DZ_DAEMON_SEVENZIP_PATH to the path of your 7-Zip executable.",
	);
	process.exit(1);
}

export const appConfig = AppConfig.parse({
	host: env.DZ_DAEMON_HOST,
	port: env.DZ_DAEMON_PORT,
	webappUrl: env.DZ_WEBAPP_URL,
	daemonUrl: env.DZ_DAEMON_URL,
	webviewWindowTitle: env.DZ_DAEMON_WEBVIEW_WINDOW_TITLE,

	enableServeDevelopment: env.DZ_ENABLE_SERVE_DEVELOPMENT,
	enableWebviewWorkerDebug: env.DZ_DAEMON_ENABLE_WEBVIEW_WORKER_DEBUG,
	enableWebview: env.DZ_ENABLE_WEBVIEW,
	enableGenerateSchema: env.DZ_ENABLE_GENERATE_SCHEMA,

	wgetPath,
	sevenzipPath,

	databasePath: env.DZ_DAEMON_DATABASE_PATH,

	webviewWorkerModulePath: env.DZ_DAEMON_WEBVIEW_WORKER_MODULE_PATH,
});
