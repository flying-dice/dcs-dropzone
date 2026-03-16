import { join, resolve } from "node:path";
import { string } from "getenv";

const OUT_DIR = "./dist";
const BUN_NAME = "app";

const outfile = join(resolve(OUT_DIR), BUN_NAME);

await Bun.build({
	entrypoints: ["./src/index.ts"],
	minify: true,
	sourcemap: "inline",
	target: "bun",
	format: "esm",
	compile: {
		outfile,
		autoloadDotenv: false,
		autoloadBunfig: false,
	},
	env: "BUN_PUBLIC_*",
	define: {
		__WEBAPP_URL: JSON.stringify(string("WEBAPP_URL", "http://localhost:3000/")),
		__DAEMON_URL: JSON.stringify(string("DAEMON_URL", "http://localhost:56499/")),
	},
});
