import { env } from "@packages/dz-config";
import { z } from "zod";

export const EnvConfig = z.object({
	DZ_WEBAPP_PORT: z.coerce.number().int().min(1).max(65535),
	DZ_WEBAPP_MONGO_URI: z.string().nonempty().optional(),
	DZ_WEBAPP_USER_COOKIE_NAME: z.string().nonempty(),
	DZ_WEBAPP_USER_COOKIE_SECRET: z.string().nonempty().optional(),
	DZ_WEBAPP_USER_COOKIE_MAX_AGE: z.coerce.number().int(),
	DZ_WEBAPP_AUTH_REDIRECT_URL: z.url().optional(),

	DZ_WEBAPP_AUTH_SERVICE_GH: z.string().optional(),

	DZ_DAEMON_URL: z.url(),
	DZ_WEBAPP_URL: z.url(),

	DZ_ENABLE_SERVE_DEVELOPMENT: z.coerce.boolean(),
	DZ_ENABLE_GENERATE_SCHEMA: z.coerce.boolean(),
});

export type EnvConfig = typeof EnvConfig;

export default EnvConfig.parse(env);
