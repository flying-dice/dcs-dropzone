#!/usr/bin/env bun
import { resolve } from "node:path";
import { $ } from "bun";
import { z } from "zod";
import { envLocalDev } from "./env.ts";

process.chdir(resolve(import.meta.dirname, "../"));

await $`bun --watch src/index.ts`.env({
	...z.record(z.string(), z.coerce.string()).parse(envLocalDev),
	...process.env,
});
