import type { ZodType } from "zod";

declare const _BUILD_DZ_BUILD_ENV: string | undefined;

/**
 * Loads build-time environment variables that were embedded by Bun's `define` option and validates
 * them against the provided Zod schema.
 *
 * The variables must have been injected at build time via {@link dump}. At runtime, the global
 * `_BUILD_DZ_BUILD_ENV` constant is parsed from JSON and validated. If the constant is absent
 * (e.g. during development without a prior build step) or the payload fails validation, the
 * function returns `undefined` rather than throwing.
 *
 * @param schema - Zod schema used to validate and type the parsed payload.
 * @returns The validated build environment, or `undefined` if the constant is not defined or
 *   the payload cannot be parsed/validated.
 */
function load<T>(schema: ZodType<T>): T | undefined {
	if (typeof _BUILD_DZ_BUILD_ENV === "undefined") {
		return undefined;
	}

	console.log("Loading build environment variables from _BUILD_DZ_BUILD_ENV", _BUILD_DZ_BUILD_ENV);
	return schema.parse(_BUILD_DZ_BUILD_ENV);
}

/**
 * Reads environment variables from `process.env` (or a provided substitute), validates them
 * against the provided Zod schema, and serialises the result into an object that can be passed
 * directly to Bun's `define` build option.
 *
 * The returned object contains a single key `_BUILD_DZ_BUILD_ENV` whose value is the JSON-encoded
 * payload. Bun will replace every reference to that global constant in the bundled output with the
 * literal string, making the values available to {@link load} at runtime without exposing the full
 * `process.env` to the bundle.
 *
 * @param schema - Zod schema used to extract and validate the relevant env vars.
 * @param env - Source of environment variables. Defaults to `process.env`. Override in tests or
 *   build scripts to supply a specific set of values.
 * @returns An object with a single `_BUILD_DZ_BUILD_ENV` string entry suitable for Bun's `define`
 *   option.
 * @throws If the environment variables do not satisfy the schema.
 */
function dump<T>(schema: ZodType<T>, env = process.env): { _BUILD_DZ_BUILD_ENV: string } {
	const values = schema.parse(env);

	console.log("Dumping build environment variables:", values);

	return {
		_BUILD_DZ_BUILD_ENV: JSON.stringify(values),
	};
}

export const BuildEnv = {
	load,
	dump,
};
