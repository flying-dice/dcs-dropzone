import { serve } from "bun";
import index from "./client/index.html";
import Application from "./server/Application.ts";
import appConfig from "./server/ApplicationConfig.ts";

console.log(`🌍 DCS Dropzone Registry Webapp Starting...`);

const server = serve({
	port: appConfig.port,
	development: process.env.NODE_ENV !== "production",
	routes: {
		"/*": index,
		"/auth": Application.server.fetch,
		"/auth/**": Application.server.fetch,
		"/api": Application.server.fetch,
		"/api/**": Application.server.fetch,
		"/v3/api-docs": Application.server.fetch,
	},
});

console.log(`🚀 Server running at ${server.url}`);
