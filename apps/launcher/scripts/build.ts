#!/usr/bin/env bun
import { resolve } from "node:path";
import { select } from "@inquirer/prompts";
import { $ } from "bun";
import { z } from "zod";
import type { BuildConfig } from "../src/config/schemas.ts";
import { envLocalBuild, envProdBuild } from "./_env.ts";

process.chdir(resolve(import.meta.dirname, "../"));

const IS_CI = process.env.CI;
const IS_TTY = process.stdin.isTTY;

enum TargetEnvironment {
	Local = "local",
	Prod = "prod",
}

const buildEnvs: Record<TargetEnvironment, BuildConfig> = {
	[TargetEnvironment.Local]: envLocalBuild,
	[TargetEnvironment.Prod]: envProdBuild,
};

const env = IS_CI
	? TargetEnvironment.Prod
	: !IS_TTY
		? TargetEnvironment.Local
		: await select({ message: "Select build target:", choices: Object.values(TargetEnvironment) });

await $`bunx depcheck`;
await $`bunx tsc --noEmit`;
await $`bunx biome check --write`;
await $`bun scripts/_build.ts`.env({
	...z.record(z.string(), z.coerce.string()).parse(buildEnvs[env]),
	...process.env,
});
