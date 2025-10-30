import { serve } from "bun";
import index from "./client/index.html";
import { app } from "./server/app.ts";
import appConfig from "./server/app-config.ts";

console.log(`🌍 DCS Dropzone Registry Webapp Starting...`);

const server = serve({
	port: appConfig.port,
	development: process.env.NODE_ENV !== "production",
	routes: {
		"/*": index,
		"/auth": app.fetch,
		"/auth/**": app.fetch,
		"/api": app.fetch,
		"/api/**": app.fetch,
		"/v3/api-docs": app.fetch,
	},
});

console.log(`🚀 Server running at ${server.url}`);
