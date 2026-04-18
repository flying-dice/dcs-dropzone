#!/usr/bin/env bun
import "./_setup-schema-env.ts";
import { generateSpecs } from "hono-openapi";
import { app } from "../src/hono/app.ts";
import { openapiSchema } from "../src/hono/openapi.ts";

const spec = await generateSpecs(app, openapiSchema);
await Bun.write("openapi.schema.json", JSON.stringify(spec, undefined, 2));

console.log("Schema written to openapi.schema.json");
process.exit(0);
