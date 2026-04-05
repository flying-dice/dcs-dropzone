import "./log4js.ts";
import { serve } from "bun";
import { getLogger } from "log4js";
import { SEVEN_ZIP_BINARIES, WGET_BINARIES } from "./constants.ts";
import { HonoApplication } from "./hono/HonoApplication.ts";
import { ProdApplication } from "./ProdApplication.ts";
import { which } from "./utils/which.ts";

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
	uiAppConfig: { webappUrl: "http://localhost:3000/", daemonUrl: "http://localhost:56499/" },
});

const server = serve({
	hostname: "127.0.0.1",
	port: 56499,
	fetch: honoApp.fetch,
});

logger.info("Daemon Playwright test server running at %s", server.url);
