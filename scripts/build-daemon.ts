import { join, resolve } from "node:path";

const OUT_DIR = "./dist/daemon";
const BUN_NAME = "appd";

const ASSETS: [string, string][] = [
	["binaries/wget.exe", ".bin/wget.exe"],
	["binaries/7za.exe", ".bin/7za.exe"],
	["binaries/7za.dll", ".bin/7za.dll"],
	["binaries/7zxa.dll", ".bin/7zxa.dll"],
	["config.toml", "config.toml"],
];

const outfile = join(resolve(OUT_DIR), BUN_NAME);

await Bun.build({
	entrypoints: ["./src/daemon/index.ts"],
	minify: true,
	compile: {
		outfile,
		windows: {
			title: "DCS Dropzone Daemon",
		},
		autoloadDotenv: false,
		autoloadBunfig: false,
	},
	env: "BUN_PUBLIC_*",
	define: {
		"process.env.NODE_ENV": `"production"`,
	},
});

for (const [src, tgt] of ASSETS) {
	await Bun.write(join(OUT_DIR, tgt), Bun.file(src));
}
