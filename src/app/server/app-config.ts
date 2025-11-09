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
	jwtSecret: z.string(),
	sessionCookieName: z.string(),
	ghClientId: z.string(),
	ghClientSecret: z.string(),
	ghAuthorizationCallbackUrl: z.string().url(),
	ghHomepageUrl: z.string().url(),
});

export type AppConfig = z.infer<typeof configSchema>;

const appConfig = configSchema.parse({
	port: int("PORT"),
	logLevel: string("LOG_LEVEL"),
	jwtSecret: string("JWT_SECRET"),
	sessionCookieName: string("SESSION_COOKIE_NAME", "JSESSIONID"),
	ghClientId: string("GH_CLIENT_ID"),
	ghClientSecret: string("GH_CLIENT_SECRET"),
	ghAuthorizationCallbackUrl: string("GH_AUTHORIZATION_CALLBACK_URL"),
	sudoUsers: string("SUDO_USERS")
		.split(",")
		.map((s) => s.trim())
		.filter((s) => s.length > 0),
	ghHomepageUrl: string("GH_HOMEPAGE_URL"),
});

export default appConfig;
