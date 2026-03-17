import { env } from "@packages/dz-config";
import { z } from "zod";

export const EnvConfig = z.object({
	DZ_DAEMON_HOST: z.ipv4(),
	DZ_DAEMON_PORT: z.coerce.number().int().min(1).max(65535),
	DZ_DAEMON_WEBVIEW_WINDOW_TITLE: z.string(),
	DZ_DAEMON_ENABLE_WEBVIEW_WORKER_DEBUG: z.coerce.boolean(),
	DZ_DAEMON_WGET_PATH: z.string().optional(),
	DZ_DAEMON_SEVENZIP_PATH: z.string().optional(),
	DZ_DAEMON_DATABASE_PATH: z.string(),
	DZ_DAEMON_WEBVIEW_WORKER_MODULE_PATH: z.string().default("./src/webview/worker.ts"),

	DZ_DAEMON_URL: z.url(),
	DZ_WEBAPP_URL: z.url(),
	DZ_ENABLE_SERVE_DEVELOPMENT: z.coerce.boolean(),
	DZ_ENABLE_GENERATE_SCHEMA: z.coerce.boolean(),
});

export type EnvConfig = typeof EnvConfig;

export default EnvConfig.parse(env);
