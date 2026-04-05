import { resolve } from "node:path";
import { $ } from "bun";
import _debug, { type Debugger } from "debug";

async function depcheck(debug: Debugger, env: typeof process.env) {
	if (env.CI) return;
	debug("Running depcheck...");
	const res = await $`bunx depcheck 2>&1`.env(env).nothrow().quiet();

	await Bun.write(".depcheck.log", res.text());
	debug(res.text());

	if (res.exitCode) {
		console.group(debug.namespace);
		console.error(res.text());
		process.exit(res.exitCode);
	}
}

async function tsc(debug: Debugger, env: typeof process.env) {
	debug("Running tsc...");
	const res = await $`bunx tsc --noEmit 2>&1`.env(env).nothrow().quiet();

	await Bun.write(".tsc.log", res.text());
	debug(res.text());

	if (res.exitCode) {
		console.group(debug.namespace);
		console.error(res.text());
		process.exit(res.exitCode);
	}
}

async function biome(debug: Debugger, env: typeof process.env) {
	if (env.CI) return; // Run once at repo root in CI (see test.yml Lint step) instead of once per workspace
	debug("Running biome...");
	const res = await $`bunx biome check --write 2>&1`.env(env).nothrow().quiet();

	await Bun.write(".biome.log", res.text());
	debug(res.text());

	if (res.exitCode) {
		console.group(debug.namespace);
		console.error(res.text());
		process.exit(res.exitCode);
	}
}

export async function _checks(env: typeof process.env) {
	const { name } = await Bun.file(resolve("package.json")).json();

	const debug = _debug(name);
	debug(`Running common build: ${process.cwd()}`);

	await depcheck(debug.extend("depcheck"), env);
	await tsc(debug.extend("tsc"), env);
	await biome(debug.extend("biome"), env);
}
