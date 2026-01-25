import { randomBytes } from "node:crypto";
import { ze } from "@packages/zod/ze";
import { int, string } from "getenv";
import { getLogger } from "log4js";
import { z } from "zod";
import { GithubAuthenticationProviderConfig } from "./authentication/GithubAuthenticationProvider.ts";

const logger = getLogger("ApplicationConfig");

const configSchema = z.object({
	nodeEnv: z.enum(["development", "production", "test"]),
	port: z.number().int().min(1).max(65535),
	mongoUri: z.string(),
	userCookieSecret: z.string().nonempty(),
	userCookieName: z.string(),
	userCookieMaxAge: z.number().int(),
	homepageUrl: z.url(),
	admins: ze.csv(),
	authServiceGh: GithubAuthenticationProviderConfig.optional(),
});

export type ApplicationConfig = z.infer<typeof configSchema>;

const authServiceGhConfigJson = string("AUTH_SERVICE_GH", "");
const cookieSecretFromEnv = string("USER_COOKIE_SECRET", randomBytes(32).toString("base64url"));

const appConfig = configSchema.parse({
	nodeEnv: string("NODE_ENV", "development"),
	port: int("PORT", 3000),
	mongoUri: string("MONGO_URI", "mongodb://memory:27017/dcs-dropzone"),
	userCookieSecret: cookieSecretFromEnv,
	userCookieName: string("USER_COOKIE_NAME", "USERID"),
	userCookieMaxAge: int("USER_COOKIE_MAX_AGE", 86400), // default to 1 day
	homepageUrl: string("HOMEPAGE_URL", "http://localhost:3000"),
	admins: string("ADMIN_IDS", "16135506, 0"),
	authServiceGh:
		authServiceGhConfigJson && authServiceGhConfigJson !== "" ? JSON.parse(authServiceGhConfigJson) : undefined,
});

logger.debug(`Application configuration loaded successfully, ENV: ${appConfig.nodeEnv}`);

export default appConfig;
