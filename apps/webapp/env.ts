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
	const { join, resolve } = await import("node:path");

	const OUT_DIR = "./dist";
	const BUN_NAME = "app";
	const outfile = join(resolve(OUT_DIR), BUN_NAME);

	const snapshotToBake = { ...liveBunEnv, ...liveCliArgs };

	// Strip out any keys containing "SECRET" to prevent leaking into the build artifact
	for (const key in snapshotToBake) {
		if (key.includes("SECRET")) delete snapshotToBake[key];
	}

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
}
