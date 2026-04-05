#!/usr/bin/env bun
import { exists, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { $ } from "bun";
import { MongoMemoryServer } from "mongodb-memory-server";
import { z } from "zod";
import { envLocalDev } from "./_env.ts";

process.chdir(resolve(import.meta.dirname, "../"));

const _env = {
	...z.record(z.string(), z.coerce.string()).parse(envLocalDev),
	...process.env,
};

if (!_env.DZ_WEBAPP_MONGO_URI) {
	if (!(await exists("./.data"))) {
		await mkdir("./.data");
	}
	const memory = new MongoMemoryServer({ instance: { port: 27018, storageEngine: "wiredTiger", dbPath: "./.data" } });
	await memory.start();
	const uri = memory.getUri();
	console.log(`Using in-memory MongoDB at ${uri}`);
	_env.DZ_WEBAPP_MONGO_URI = uri;
}

await $`bun --hot src/index.ts`.env(_env);
