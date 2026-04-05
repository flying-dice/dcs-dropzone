#!/usr/bin/env bun
import { resolve } from "node:path";
import { _commonTest } from "../../../scripts/_common-test.ts";

process.chdir(resolve(import.meta.dirname, "../"));

await _commonTest(process.env);
