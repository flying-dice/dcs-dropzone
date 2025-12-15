import { int, string } from "getenv";
import { z } from "zod";

const configSchema = z.object({
	port: z.number().int().min(1).max(65535),
	mongoUri: z.string(),
	authDisabled: z.boolean(),
	userCookieSecret: z.string().optional(),
	userCookieName: z.string(),
	userCookieMaxAge: z.number().int(),
	ghClientId: z.string().optional(),
	ghClientSecret: z.string().optional(),
	ghAuthorizationCallbackUrl: z.string().url().optional(),
	ghHomepageUrl: z.url().optional(),
	admins: z.string().transform((it) => it.split(",").map((id) => id.trim())),
});

export type ApplicationConfig = z.infer<typeof configSchema>;

const appConfig = configSchema.parse({
	port: int("PORT", 3000),
	mongoUri: string("MONGO_URI", "mongodb://memory:27017/dcs-dropzone"),
	authDisabled: string("AUTH_DISABLED", "false") === "true",
	userCookieSecret: string("USER_COOKIE_SECRET", "dev-secret-key"),
	userCookieName: string("USER_COOKIE_NAME", "USERID"),
	userCookieMaxAge: int("USER_COOKIE_MAX_AGE", 86400), // default to 1 day
	ghClientId: string("GH_CLIENT_ID", ""),
	ghClientSecret: string("GH_CLIENT_SECRET", ""),
	ghAuthorizationCallbackUrl: string("GH_AUTHORIZATION_CALLBACK_URL", "http://localhost:3000/auth/callback"),
	ghHomepageUrl: string("GH_HOMEPAGE_URL", "http://localhost:3000"),
	admins: string("ADMIN_IDS", "16135506"),
});

// Validate auth configuration at startup
if (!appConfig.authDisabled && !appConfig.userCookieSecret) {
	throw new Error("USER_COOKIE_SECRET must be set when AUTH_DISABLED is false");
}

export default appConfig;
