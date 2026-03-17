import { existsSync, mkdirSync } from "node:fs";
import { normalize, resolve } from "node:path";
import { Result } from "neverthrow";
import { z } from "zod";
import { expandEnvVars } from "./expandEnvVars.ts";

/**
 * Executes a sync function, returning the error if it throws, or undefined on success.
 */
function safeSync(fn: () => void): Error | undefined {
	const result = Result.fromThrowable(fn, (e) => (e instanceof Error ? e : new Error(String(e))))();
	return result.isErr() ? result.error : undefined;
}

export default (props: { exists?: "ensure" | "check"; resolve: boolean; normalize: boolean; expandEnvVars: boolean }) =>
	z
		.string()
		.nonempty()
		.transform((it) => {
			let result = it;
			if (props.expandEnvVars) {
				result = expandEnvVars(result);
			}
			if (props.resolve) {
				result = resolve(result);
			}
			if (props.normalize) {
				result = normalize(result);
			}
			return result;
		})
		.superRefine((value, ctx) => {
			if (props.exists === "ensure" && !existsSync(value)) {
				const result = safeSync(() => mkdirSync(value));
				if (result !== undefined) {
					ctx.addIssue({
						code: "custom",
						message: result.message,
						values: [value],
					});
				}
			}

			if (props.exists === "check" && !existsSync(value)) {
				ctx.addIssue({
					code: "custom",
					message: `Path does not exist: ${value}`,
					values: [value],
				});
			}
		});
