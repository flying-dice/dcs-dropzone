import "../common/log4js.ts";
import { exists, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { serve } from "bun";
import { ensureDir, readFile } from "fs-extra";
import { getLogger } from "log4js";
import Application from "./Application.ts";
import appConfig from "./ApplicationConfig.ts";

console.info(`🌍 DCS Dropzone Daemon Starting...`);

const logger = getLogger("index");

const server = serve({
	hostname: appConfig.server.host,
	port: appConfig.server.port,
	development: process.env.NODE_ENV !== "production",
	routes: {
		"/api": Application.server.fetch,
		"/api/**": Application.server.fetch,
		"/v3/api-docs": Application.server.fetch,
	},
});

logger.info(`🚀 Server running at ${server.url}`);

async function getSystemId() {
	const sidf = join(process.cwd(), ".dropzone", "sid.uuid");
	await ensureDir(dirname(sidf));
	if (!(await exists(sidf))) {
		const id = crypto.randomUUID();
		await writeFile(sidf, id, "utf-8");
		return id;
	} else {
		return readFile(sidf, "utf-8");
	}
}

logger.info(await getSystemId());
