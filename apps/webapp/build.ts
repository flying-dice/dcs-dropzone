import { join, resolve } from "node:path";
import env from "./env.ts";

const OUT_DIR = "./dist";
const BUN_NAME = "app";

const outfile = join(resolve(OUT_DIR), BUN_NAME);

console.log("_BUILD_DZ_ENV", env);

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
		_BUILD_DZ_ENV: JSON.stringify(env),
	},
});
