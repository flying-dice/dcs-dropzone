import { join, resolve } from "node:path";
import { BuildEnv } from "@packages/dz-config";
import { BuildConfig } from "../src/config/schemas.ts";

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
		...BuildEnv.dump(BuildConfig, process.env),
	},
});
