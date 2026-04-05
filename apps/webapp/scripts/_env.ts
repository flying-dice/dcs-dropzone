import type { BuildConfig, EnvConfig } from "../src/config/schemas.ts";

export const envLocalDev: Omit<EnvConfig, "DZ_WEBAPP_MONGO_URI"> = {
	DZ_WEBAPP_PORT: 3000,
	// Uncomment to disable mongo memory server and connect to a local mongo instance instead like Docker
	// DZ_WEBAPP_MONGO_URI: "mongodb://localhost:27017/dcs-dropzone",
	DZ_WEBAPP_USER_COOKIE_NAME: "USERID",
	DZ_WEBAPP_USER_COOKIE_SECRET: "local-cookie-secret",
	DZ_WEBAPP_USER_COOKIE_MAX_AGE: 86400,
	DZ_WEBAPP_AUTH_REDIRECT_URL: "http://localhost:3000/",
	DZ_DAEMON_URL: "http://localhost:56499/",
	DZ_WEBAPP_URL: "http://localhost:3000/",
	DZ_ENABLE_SERVE_DEVELOPMENT: true,
	DZ_ENABLE_GENERATE_SCHEMA: true,
};

export const envLocalTest: Omit<EnvConfig, "DZ_WEBAPP_MONGO_URI"> = {
	DZ_WEBAPP_PORT: 3000,
	DZ_WEBAPP_USER_COOKIE_NAME: "USERID",
	DZ_WEBAPP_USER_COOKIE_SECRET: "test-cookie-secret",
	DZ_WEBAPP_USER_COOKIE_MAX_AGE: 86400,
	DZ_DAEMON_URL: "http://localhost:56499/",
	DZ_WEBAPP_URL: "http://localhost:3000/",
	DZ_WEBAPP_AUTH_REDIRECT_URL: "http://localhost:3000/",
	DZ_ENABLE_SERVE_DEVELOPMENT: false,
	DZ_ENABLE_GENERATE_SCHEMA: false,
};

export const envLocalBuild: BuildConfig = {
	DZ_WEBAPP_PORT: 3000,
	DZ_WEBAPP_USER_COOKIE_NAME: "USERID",
	DZ_WEBAPP_USER_COOKIE_MAX_AGE: 86400,
	DZ_DAEMON_URL: "http://localhost:56499/",
	DZ_ENABLE_SERVE_DEVELOPMENT: false,
	DZ_ENABLE_GENERATE_SCHEMA: false,
};

export const envProdBuild: BuildConfig = {
	DZ_WEBAPP_PORT: 3000,
	DZ_WEBAPP_USER_COOKIE_NAME: "USERID",
	DZ_WEBAPP_USER_COOKIE_MAX_AGE: 86400,
	DZ_DAEMON_URL: "http://localhost:56499/",
	DZ_ENABLE_SERVE_DEVELOPMENT: false,
	DZ_ENABLE_GENERATE_SCHEMA: false,
};
