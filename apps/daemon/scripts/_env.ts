import type { BuildConfig, EnvConfig } from "../src/config/schemas.ts";

export const envLocalDev: EnvConfig = {
	DZ_DAEMON_HOST: "127.0.0.1",
	DZ_DAEMON_PORT: 56499,
	DZ_DAEMON_WEBVIEW_WINDOW_TITLE: "Dropzone",
	DZ_DAEMON_ENABLE_WEBVIEW_WORKER_DEBUG: true,
	DZ_DAEMON_DATABASE_PATH: "data.sqlite",

	DZ_WEBAPP_URL: "http://localhost:3000/",
	DZ_DAEMON_URL: "http://localhost:56499/",
	DZ_ENABLE_SERVE_DEVELOPMENT: true,
	DZ_ENABLE_GENERATE_SCHEMA: true,
	DZ_DAEMON_WEBVIEW_WORKER_MODULE_PATH: "./src/webview/worker.ts",
};

export const envLocalTest: EnvConfig = {
	DZ_DAEMON_HOST: "127.0.0.1",
	DZ_DAEMON_PORT: 56499,
	DZ_DAEMON_WEBVIEW_WINDOW_TITLE: "Dropzone",
	DZ_DAEMON_ENABLE_WEBVIEW_WORKER_DEBUG: false,
	DZ_DAEMON_DATABASE_PATH: ":memory:",

	DZ_WEBAPP_URL: "http://localhost:3000/",
	DZ_DAEMON_URL: "http://localhost:56499/",
	DZ_ENABLE_SERVE_DEVELOPMENT: false,
	DZ_ENABLE_GENERATE_SCHEMA: false,
	DZ_DAEMON_WEBVIEW_WORKER_MODULE_PATH: "./src/webview/worker.ts",
};

export const envLocalBuild: BuildConfig = {
	DZ_DAEMON_HOST: "127.0.0.1",
	DZ_DAEMON_PORT: 56499,
	DZ_DAEMON_WEBVIEW_WINDOW_TITLE: "Dropzone",
	DZ_DAEMON_ENABLE_WEBVIEW_WORKER_DEBUG: false,
	DZ_DAEMON_DATABASE_PATH: "data.sqlite",

	DZ_WEBAPP_URL: "http://localhost:3000/",
	DZ_DAEMON_URL: "http://localhost:56499/",
	DZ_ENABLE_SERVE_DEVELOPMENT: false,
	DZ_ENABLE_GENERATE_SCHEMA: false,
	DZ_DAEMON_WEBVIEW_WORKER_MODULE_PATH: "./webview/worker.ts",
};

export const envProdBuild: BuildConfig = {
	DZ_DAEMON_HOST: "127.0.0.1",
	DZ_DAEMON_PORT: 56499,
	DZ_DAEMON_WEBVIEW_WINDOW_TITLE: "Dropzone",
	DZ_DAEMON_ENABLE_WEBVIEW_WORKER_DEBUG: false,
	DZ_DAEMON_DATABASE_PATH: "data.sqlite",

	DZ_WEBAPP_URL: "https://dcs-dropzone-container.flying-dice.workers.dev/",
	DZ_DAEMON_URL: "http://localhost:56499/",
	DZ_ENABLE_SERVE_DEVELOPMENT: false,
	DZ_ENABLE_GENERATE_SCHEMA: false,
	DZ_DAEMON_WEBVIEW_WORKER_MODULE_PATH: "./webview/worker.ts",
};
