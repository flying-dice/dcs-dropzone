import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { ze } from "@packages/zod";
import { int, string } from "getenv";
import { getLogger } from "log4js";
import { z } from "zod";
import { version } from "../package.json";
import { GithubAuthenticationProviderConfig } from "./authentication/GithubAuthenticationProvider.ts";

const logger = getLogger("ApplicationConfig");

const configSchema = z.object({
	version: z.string(),
	nodeEnv: z.enum(["development", "production", "test"]),
	port: z.number().int().min(1).max(65535),
	mongoUri: z.string(),
	userCookieSecret: z.string(),
	userCookieName: z.string(),
	userCookieMaxAge: z.number().int(),
	homepageUrl: z.url(),
	admins: ze.csv(),
	authServiceGh: GithubAuthenticationProviderConfig.optional(),
});

export type ApplicationConfig = z.infer<typeof configSchema>;

function getOrGenerateCookieSecret(): string {
	if (existsSync(".cookie_secret")) {
		return readFileSync(".cookie_secret", "utf8");
	}

	const cookieSecret = randomBytes(32).toString("base64url");
	writeFileSync(".cookie_secret", cookieSecret);

	return getOrGenerateCookieSecret();
}

const authServiceGhConfigJson = string("AUTH_SERVICE_GH", "");

const appConfig = configSchema.parse({
	version,
	nodeEnv: string("NODE_ENV", "development"),
	port: int("PORT", 3000),
	mongoUri: string("MONGO_URI", "mongodb://memory:27017/dcs-dropzone"),
	userCookieSecret: string("USER_COOKIE_SECRET", getOrGenerateCookieSecret()),
	userCookieName: string("USER_COOKIE_NAME", "USERID"),
	userCookieMaxAge: int("USER_COOKIE_MAX_AGE", 86400), // default to 1 day
	homepageUrl: string("HOMEPAGE_URL", "http://localhost:3000"),
	admins: string("ADMIN_IDS", "16135506, 0"),
	authServiceGh:
		authServiceGhConfigJson && authServiceGhConfigJson !== "" ? JSON.parse(authServiceGhConfigJson) : undefined,
});

logger.debug(`Application configuration loaded successfully, ENV: ${appConfig.nodeEnv}`);

export default appConfig;
