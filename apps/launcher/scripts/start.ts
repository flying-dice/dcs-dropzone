#!/usr/bin/env bun
import { resolve } from "node:path";

process.chdir(resolve(import.meta.dirname, "../"));

Bun.spawn(["./dist/Dropzone_Launcher.exe"], {
	stdout: "inherit",
	stdin: "inherit",
	stderr: "inherit",
});
