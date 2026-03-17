import { parseArgs } from "node:util";

declare global {
	var _BUILD_DZ_ENV: Record<string, string> | undefined;
}

// Safely capture the build snapshot (injected by Bun at build time via define)
const buildSnapshot = typeof _BUILD_DZ_ENV !== "undefined" ? _BUILD_DZ_ENV : {};

// Capture live environment variables starting with DZ_
const liveBunEnv: Record<string, string> = Object.fromEntries(
	Object.entries(Bun.env).filter(
		(entry): entry is [string, string] => entry[0].startsWith("DZ_") && entry[1] !== undefined,
	),
);

// Capture CLI arguments starting with DZ_
const { values } = parseArgs({ args: Bun.argv, strict: false });
const liveCliArgs: Record<string, string> = Object.fromEntries(
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
