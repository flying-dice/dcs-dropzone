#!/usr/bin/env bun
import { resolve } from "node:path";
import { envLocalDev } from "./env.ts";

// Set env vars so config parsing succeeds
const envParsed = Object.fromEntries(Object.entries(envLocalDev).map(([k, v]) => [k, String(v)]));
Object.assign(process.env, envParsed);

process.chdir(resolve(import.meta.dirname, "../"));

const { ProdApplication } = await import("../src/ProdApplication.ts");
const { HonoApplication } = await import("../src/hono/HonoApplication.ts");

const app = new ProdApplication({
	databaseUrl: ":memory:",
	wgetExecutablePath: "wget",
	sevenZipExecutablePath: "7za",
});
await HonoApplication.build(app, {
	enableGenerateSchema: true,
	uiAppConfig: {
		webappUrl: envLocalDev.DZ_WEBAPP_URL,
		daemonUrl: envLocalDev.DZ_DAEMON_URL,
	},
});

console.log("Schema written to openapi.schema.json");
