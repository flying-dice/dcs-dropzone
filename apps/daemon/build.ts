import { join, resolve } from "node:path";

const OUT_DIR = "./dist";
const BUN_NAME = "appd";

const ASSETS: [string, string][] = [
	["bin/wget.exe", ".bin/wget.exe"],
	["bin/7za.exe", ".bin/7za.exe"],
	["bin/7za.dll", ".bin/7za.dll"],
	["bin/7zxa.dll", ".bin/7zxa.dll"],
	["config.dist.toml", "config.toml"],
];

const outfile = join(resolve(OUT_DIR), BUN_NAME);

await Bun.build({
	entrypoints: ["./src/index.ts"],
	minify: true,
	sourcemap: "inline",
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
