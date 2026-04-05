import "./src/log4js.ts";
import { serve } from "bun";
import { getLogger } from "log4js";
import { SEVEN_ZIP_BINARIES, WGET_BINARIES } from "./src/constants.ts";
import { HonoApplication } from "./src/hono/HonoApplication.ts";
import { ProdApplication } from "./src/ProdApplication.ts";
import index from "./src/ui/index.html";
import { which } from "./src/utils/which.ts";

const logger = getLogger("playwright-server");

const wgetPath = WGET_BINARIES.map(which).find(Boolean);
const sevenzipPath = SEVEN_ZIP_BINARIES.map(which).find(Boolean);

if (!wgetPath || !sevenzipPath) {
	logger.error("Required binaries not found: wget=%s, 7zip=%s", wgetPath, sevenzipPath);
	process.exit(1);
}

const app = new ProdApplication({
	databaseUrl: ":memory:",
	wgetExecutablePath: wgetPath,
	sevenZipExecutablePath: sevenzipPath,
});

const honoApp = await HonoApplication.build(app, {
	enableGenerateSchema: false,
	uiAppConfig: { webappUrl: "http://localhost:3000/", daemonUrl: "http://127.0.0.1:56499/" },
});

const server = serve({
	hostname: "127.0.0.1",
	port: 56499,
	development: true,
	routes: {
		"/*": index,
		"/api": honoApp.fetch,
		"/api/**": honoApp.fetch,
		"/v3/api-docs": honoApp.fetch,
	},
});

logger.info("Daemon Playwright test server running at %s", server.url);
