#!/usr/bin/env bun
import { resolve } from "node:path";
import { $ } from "bun";
import { _checks } from "../../../scripts/_checks.ts";

process.chdir(resolve(import.meta.dirname, "../"));

await $`bunx orval --config orval.config.cjs`;

await _checks(process.env);
