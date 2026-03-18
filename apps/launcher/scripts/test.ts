#!/usr/bin/env bun
import { resolve } from "node:path";
import { $ } from "bun";
import { z } from "zod";
import { envLocalBuild } from "./_env.ts";

process.chdir(resolve(import.meta.dirname, "../"));

await $`bun test --coverage`.env({
	...z.record(z.string(), z.coerce.string()).parse(envLocalBuild),
	...process.env,
});
