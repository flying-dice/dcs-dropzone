import { int, string } from "getenv";
import { z } from "zod";

const configSchema = z.object({
	port: z.number().int().min(1).max(65535),
	logLevel: z.enum([
		"fatal",
		"error",
		"warn",
		"info",
		"debug",
		"trace",
		"silent",
	]),
	userCookieSecret: z.string(),
	userCookieName: z.string(),
	userCookieMaxAge: z.number().int(),
	ghClientId: z.string(),
	ghClientSecret: z.string(),
	ghAuthorizationCallbackUrl: z.string().url(),
	ghHomepageUrl: z.string().url(),
});

export type ApplicationConfig = z.infer<typeof configSchema>;

const appConfig = configSchema.parse({
	port: int("PORT"),
	logLevel: string("LOG_LEVEL"),
	userCookieSecret: string("USER_COOKIE_SECRET"),
	userCookieName: string("USER_COOKIE_NAME", "USERID"),
	userCookieMaxAge: int("USER_COOKIE_MAX_AGE", 86400), // default to 1 day
	ghClientId: string("GH_CLIENT_ID"),
	ghClientSecret: string("GH_CLIENT_SECRET"),
	ghAuthorizationCallbackUrl: string("GH_AUTHORIZATION_CALLBACK_URL"),
	ghHomepageUrl: string("GH_HOMEPAGE_URL"),
});

export default appConfig;
