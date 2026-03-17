import { join, resolve } from "node:path";
import { getBuildDzEnv } from "@packages/dz-config";

const OUT_DIR = "./dist";
const BUN_NAME = "Dropzone_Launcher";

const outfile = join(resolve(OUT_DIR), BUN_NAME);
const buildDzEnv = getBuildDzEnv();

console.log("Baking _BUILD_DZ_ENV:", buildDzEnv);

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
		windows: {
			title: "DCS Dropzone | Launcher",
			description: "DCS Dropzone Launcher Application for managing Dropzone installations and starting the Daemon.",
			icon: "icon.ico",
			hideConsole: true,
		},
	},
	env: "BUN_PUBLIC_*",
	define: {
		_BUILD_DZ_ENV: buildDzEnv,
	},
});
