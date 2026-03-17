import { parseArgs } from "util";
import type { ZodSchema } from "zod";

declare global {
	var _BUILD_DZ_ENV: Record<string, string> | undefined;
}

// Safely capture the build snapshot (injected by Bun at build time via define)
const buildSnapshot = typeof _BUILD_DZ_ENV !== "undefined" ? _BUILD_DZ_ENV : {};

// Capture live environment variables starting with DZ_
const liveBunEnv = Object.fromEntries(Object.entries(Bun.env).filter(([key]) => key.startsWith("DZ_")));

// Capture CLI arguments starting with DZ_
const { values } = parseArgs({ args: Bun.argv, strict: false });
const liveCliArgs = Object.fromEntries(
	Object.entries(values)
		.filter(([key]) => key.startsWith("DZ_"))
		.map(([key, value]) => [key, String(value)]),
);

/**
 * Resolved environment variables.
 * Resolution hierarchy (highest to lowest): CLI args > Bun.env > _BUILD_DZ_ENV snapshot.
 * Only DZ_-prefixed variables are included.
 */
export const env: Record<string, string> = {
	...buildSnapshot,
	...liveBunEnv,
	...liveCliArgs,
};

/**
 * Returns a JSON string of the current DZ_* environment variables to bake into
 * the compiled binary via Bun.build define. Keys containing "SECRET" are stripped.
 * An optional Zod schema can be provided to validate the snapshot at build time.
 * Pass the result to: define: { _BUILD_DZ_ENV: getBuildDzEnv() }
 */
export function getBuildDzEnv(schema?: ZodSchema): string {
	const snapshot = { ...liveBunEnv, ...liveCliArgs };
	for (const key in snapshot) {
		if (key.includes("SECRET")) delete snapshot[key];
	}
	schema?.parse(snapshot);
	return JSON.stringify(snapshot);
}
