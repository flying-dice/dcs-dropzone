#!/usr/bin/env bun
import "./_setup-schema-env.ts";
import { generateSpecs } from "hono-openapi";
import { app } from "../src/hono/app.ts";

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
