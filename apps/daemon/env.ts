import { parseArgs } from "util";

declare global {
	var _BUILD_DZ_ENV: Record<string, string> | undefined;
}

// 1. Parse CLI Arguments (allows arbitrary --DZ_KEY=value overrides)
const { values } = parseArgs({ args: Bun.argv, strict: false });

// 2. Safely capture the build snapshot (injected by Bun at build time)
const buildSnapshot = typeof _BUILD_DZ_ENV !== "undefined" ? _BUILD_DZ_ENV : {};

// 3. Capture live environment variables starting with DZ_
const liveBunEnv = Object.fromEntries(Object.entries(Bun.env).filter(([key]) => key.startsWith("DZ_")));

// 4. Capture CLI arguments starting with DZ_
const liveCliArgs = Object.fromEntries(
	Object.entries(values)
		.filter(([key]) => key.startsWith("DZ_"))
		.map(([key, value]) => [key, String(value)]),
);

// 5. Export resolved environment (Hierarchy: CLI > Bun.env > Snapshot)
export const env = {
	...buildSnapshot,
	...liveBunEnv,
	...liveCliArgs,
};

// 6. Build Orchestrator (executes only when running `bun env.ts` directly)
if (import.meta.main) {
	const { exists, rm } = await import("node:fs/promises");
	const { join, resolve } = await import("node:path");
	const { writeManifest } = await import("@packages/manifest");

	const OUT_DIR = "./dist";
	const BUN_NAME = "Dropzone";
	const BUN_ARCHIVE_NAME = "dcs-dropzone.tar";
	const BUN_ARCHIVE_PATH = join(OUT_DIR, BUN_ARCHIVE_NAME);
	const BUN_ARCHIVE_MANIFEST_PATH = `${BUN_ARCHIVE_PATH}.manifest`;

	const ASSETS: [string, string][] = [
		["bin/wget.exe", "bin/wget.exe"],
		["bin/7za.exe", "bin/7za.exe"],
		["bin/7za.dll", "bin/7za.dll"],
		["bin/7zxa.dll", "bin/7zxa.dll"],
	];

	const snapshotToBake = { ...liveBunEnv, ...liveCliArgs };

	// Strip out any keys containing "SECRET" to prevent leaking into the build artifact
	for (const key in snapshotToBake) {
		if (key.includes("SECRET")) delete snapshotToBake[key];
	}

	console.log("Baking _BUILD_DZ_ENV snapshot:", snapshotToBake);
	console.log("Building release archive:", BUN_ARCHIVE_NAME);

	if (await exists(BUN_ARCHIVE_PATH)) {
		console.log("Removing existing archive:", BUN_ARCHIVE_PATH);
		await rm(BUN_ARCHIVE_PATH);
	}

	const outfile = join(resolve(OUT_DIR), BUN_NAME);

	console.log("Building Project with Bun...");
	await Bun.build({
		entrypoints: ["./src/index.ts", "./src/webview/worker.ts"],
		minify: true,
		sourcemap: "inline",
		compile: {
			outfile,
			windows: {
				title: "DCS Dropzone | Daemon",
				description: "DCS Dropzone Daemon Application for managing Dropzone releases and installations.",
				icon: "icon.ico",
				hideConsole: true,
			},
			autoloadDotenv: false,
			autoloadBunfig: false,
		},
		env: "BUN_PUBLIC_*",
		define: {
			_BUILD_DZ_ENV: JSON.stringify(snapshotToBake),
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
		const outputPath = join(OUT_DIR, file);
		filesForArchive[file] = await Bun.file(outputPath).arrayBuffer();
	}

	const archive = new Bun.Archive(filesForArchive);
	await Bun.write(BUN_ARCHIVE_PATH, archive);

	const hasher = new Bun.CryptoHasher("sha256");
	hasher.update(await archive.bytes());
	const digest = hasher.digest("hex");

	await writeManifest(BUN_ARCHIVE_MANIFEST_PATH, {
		__version: process.env.RELEASE_VERSION || "0.0.0",
		__tag: process.env.RELEASE_TAG || "v0.0.0-dev",
		createdAt: new Date(),
		files: await archive.files().then((it) =>
			it
				.entries()
				.toArray()
				.map(([n, _f]) => n)
				.filter((it) => !it.endsWith(".manifest")),
		),
		etag: digest,
	});

	console.log("Created archive at:", BUN_ARCHIVE_PATH);
}
