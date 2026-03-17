import { join, resolve } from "node:path";
import { createBuildSnapshot } from "@packages/dz-config";

const OUT_DIR = "./dist";
const BUN_NAME = "app";

const outfile = join(resolve(OUT_DIR), BUN_NAME);
const snapshotToBake = createBuildSnapshot();

console.log("Baking _BUILD_DZ_ENV snapshot:", snapshotToBake);

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
		_BUILD_DZ_ENV: JSON.stringify(snapshotToBake),
	},
});
