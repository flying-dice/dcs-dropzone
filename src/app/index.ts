import { serve } from "bun";
import index from "./client/index.html";
import { application } from "./server/Application.ts";
import appConfig from "./server/ApplicationConfig.ts";

console.log(`🌍 DCS Dropzone Registry Webapp Starting...`);

const server = serve({
	port: appConfig.port,
	development: process.env.NODE_ENV !== "production",
	routes: {
		"/*": index,
		"/auth": application.fetch,
		"/auth/**": application.fetch,
		"/api": application.fetch,
		"/api/**": application.fetch,
		"/v3/api-docs": application.fetch,
	},
});

console.log(`🚀 Server running at ${server.url}`);
