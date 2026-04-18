#!/usr/bin/env bun
import { resolve } from "node:path";
import { generateSpecs } from "hono-openapi";
import { envLocalDev } from "./_env.ts";

// Set env vars so config parsing succeeds
const envParsed = Object.fromEntries(Object.entries(envLocalDev).map(([k, v]) => [k, String(v)]));
Object.assign(process.env, envParsed);
process.env.DZ_DAEMON_DATABASE_PATH = ":memory:";

process.chdir(resolve(import.meta.dirname, "../"));

const { app } = await import("../src/hono/app.ts");

const spec = await generateSpecs(app, {
	documentation: {
		info: {
			title: "DCS Dropzone Daemon API",
			version: "1.0.0",
			description: "API documentation for the DCS Dropzone Daemon.",
		},
	},
});
await Bun.write("openapi.schema.json", JSON.stringify(spec, undefined, 2));

console.log("Schema written to openapi.schema.json");
