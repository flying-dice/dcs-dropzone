import { resolve } from "node:path";
import { $ } from "bun";
import _debug, { type Debugger } from "debug";

async function test(debug: Debugger, env: typeof process.env) {
	debug("Running test...");
	const res = await $`bun test --coverage --reporter junit --reporter-outfile unit.junit.xml --pass-with-no-tests 2>&1`
		.nothrow()
		.quiet()
		.env(env);

	await Bun.write(".test.log", Bun.stripANSI(res.text()));
	debug(res.text());

	if (res.exitCode) {
		console.group(debug.namespace);
		console.error(res.text());
		process.exit(res.exitCode);
	}
}

export async function _commonTest(env: typeof process.env) {
	const { name } = await Bun.file(resolve("package.json")).json();

	const debug = _debug(name);
	debug(`Running common test: ${process.cwd()}`);

	await Promise.all([test(debug.extend("test"), env)]);
}
