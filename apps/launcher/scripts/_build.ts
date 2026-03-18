import { join, resolve } from "node:path";
import { BuildEnv } from "@packages/dz-config";
import { BuildConfig } from "../src/config/schemas.ts";

const OUT_DIR = "./dist";
const BUN_NAME = "Dropzone_Launcher";

const outfile = join(resolve(OUT_DIR), BUN_NAME);

await Bun.build({
	entrypoints: ["./src/index.ts"],
	minify: true,
	sourcemap: "inline",
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
		...BuildEnv.dump(BuildConfig, process.env),
	},
});
