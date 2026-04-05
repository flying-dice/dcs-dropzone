#!/usr/bin/env bun
import { platform } from "node:os";
import { resolve } from "node:path";
import { $ } from "bun";
import { z } from "zod";
import { _checks } from "../../../scripts/_checks.ts";
import { getForCurrentTargetEnv, TargetEnvironment } from "../../../scripts/_target-env.ts";
import type { BuildConfig } from "../src/config/schemas.ts";
import { envLocalBuild, envProdBuild } from "./_env.ts";

process.chdir(resolve(import.meta.dirname, "../"));

const buildEnvs: Record<TargetEnvironment, BuildConfig> = {
	[TargetEnvironment.Local]: envLocalBuild,
	[TargetEnvironment.Prod]: envProdBuild,
};

const _env = {
	...z.record(z.string(), z.coerce.string()).parse(getForCurrentTargetEnv(buildEnvs)),
	...process.env,
};

await _checks(_env);
await $`bun scripts/_build.ts`.env(_env);
if (platform() === "win32") {
	await $`iscc installer.iss`.env(_env);
}
