import type { BlankSchema } from "hono/types";
import { appConfig } from "../config";

export const openapiSchema: BlankSchema = {
	documentation: {
		info: {
			title: "DCS Dropzone Registry API",
			version: "1.0.0",
			description: "API documentation for the DCS Dropzone Registry.",
		},
		tags: [
			{ name: "Auth", description: "Authentication and session management" },
			{ name: "Health", description: "Service health and readiness" },
			{ name: "Dashboard", description: "Dashboard and metrics endpoints" },
			{ name: "Categories", description: "Mod category endpoints" },
			{ name: "Tags", description: "Mod tag endpoints" },
			{ name: "Config", description: "Application configuration endpoints" },
			{ name: "Mods", description: "Public mod catalogue endpoints" },
			{ name: "Mod Releases", description: "Public mod release endpoints" },
			{ name: "Mod Release Downloads", description: "Mod release download endpoints" },
			{
				name: "User Mods",
				description: "Manage mods owned by the authenticated user",
			},
			{
				name: "User Mod Releases",
				description: "Manage releases for user-owned mods",
			},
			{
				name: "Migration",
				description: "Administrative data migration endpoints",
			},
		],
		components: {
			securitySchemes: {
				cookieAuth: {
					type: "apiKey",
					in: "cookie",
					name: appConfig.userCookieName,
					description: "Session cookie used for authenticating user endpoints. Set after successful OAuth login.",
				},
			},
		},
	},
};
