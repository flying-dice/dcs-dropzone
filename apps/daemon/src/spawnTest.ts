import * as assert from "node:assert";
import { spawn } from "node:child_process";
import { delimiter, join } from "node:path";
import { which } from "bun";

await new Promise((resolve, reject) => {
	const wgetPath = which("wget", { PATH: [join(process.cwd(), "bin"), process.env.PATH].join(delimiter) });

	assert.ok(wgetPath);
	console.log(wgetPath);

	const proc = spawn(wgetPath, [], {
		stdio: "pipe",
	});

	proc.stdout.on("data", (data) => {
		console.log(data.toString());
	});

	proc.stderr.on("data", (data: any) => {
		console.error(data.toString());
	});

	proc.on("error", (err) => {
		console.error("Error spawning wget:", err);
		reject(err);
	});

	proc.on("exit", (code, signal) => {
		console.info(`Wget process exited with code ${code} and signal ${signal}`);
		resolve(code);
	});
});
