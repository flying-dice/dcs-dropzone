import { exists, rm } from "node:fs/promises";
import { join, resolve } from "node:path";

const OUT_DIR = "./dist";
const BUN_NAME = "appd";
const BUN_ARCHIVE_NAME = `dcs-dropzone-daemon.tar`;
const BUN_ARCHIVE_PATH = join(OUT_DIR, BUN_ARCHIVE_NAME);

console.log("Building release archive:", BUN_ARCHIVE_NAME);
if (await exists(BUN_ARCHIVE_PATH)) {
	console.log("Removing existing archive:", BUN_ARCHIVE_PATH);
	await rm(BUN_ARCHIVE_PATH);
}

const ASSETS: [string, string][] = [
	["bin/wget.exe", "bin/wget.exe"],
	["bin/7za.exe", "bin/7za.exe"],
	["bin/7za.dll", "bin/7za.dll"],
	["bin/7zxa.dll", "bin/7zxa.dll"],
	["config.dist.toml", "config.toml"],
];

const outfile = join(resolve(OUT_DIR), BUN_NAME);

console.log("Building Project with Bun...");
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

console.log("Copying assets...");

for (const [src, tgt] of ASSETS) {
	console.log(`Copying asset: ${src} -> ${tgt}`);
	await Bun.write(join(OUT_DIR, tgt), Bun.file(src));
}

console.log("Creating release archive...");
const releaseFilesGlob = new Bun.Glob("**/*");

const filesForArchive: Record<string, ArrayBuffer> = {};

for await (const file of releaseFilesGlob.scan(OUT_DIR)) {
	console.log("Adding file to archive:", file);
	filesForArchive[file] = await Bun.file(join(OUT_DIR, file)).arrayBuffer();
}

const archive = new Bun.Archive(filesForArchive);
await Bun.write(BUN_ARCHIVE_PATH, archive);
console.log("Created archive at:", BUN_ARCHIVE_PATH);
