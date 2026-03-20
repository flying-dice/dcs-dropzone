#!/usr/bin/env bun
import { resolve } from "node:path";
import { z } from "zod";
import { _commonTest } from "../../../scripts/_common-test.ts";
import { envLocalBuild } from "./_env.ts";

process.chdir(resolve(import.meta.dirname, "../"));

await _commonTest({
	...z.record(z.string(), z.coerce.string()).parse(envLocalBuild),
	...process.env,
});
