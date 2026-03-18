#!/usr/bin/env bun
import { resolve } from "node:path";
import { $ } from "bun";
import { z } from "zod";
import { envLocalBuild } from "./_env.ts";

process.chdir(resolve(import.meta.dirname, "../"));

await $`bunx biome check --write`;
await $`bun --watch src/index.ts`.env({
	...z.record(z.string(), z.coerce.string()).parse(envLocalBuild),
	...process.env,
});
