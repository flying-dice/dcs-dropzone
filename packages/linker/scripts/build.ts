#!/usr/bin/env bun
import { resolve } from "node:path";
import { _checks } from "../../../scripts/_checks.ts";

process.chdir(resolve(import.meta.dirname, "../"));

await _checks(process.env);
