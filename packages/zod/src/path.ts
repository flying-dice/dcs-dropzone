import { existsSync, mkdirSync, statSync } from "node:fs";
import { normalize, resolve } from "node:path";
import { z } from "zod";
import { expandEnvVars } from "./expandEnvVars.ts";

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
				try {
					mkdirSync(value);
				} catch (e) {
					ctx.addIssue({
						code: "custom",
						message: e.message,
						values: [value],
					});
				}
			}

			if (props.exists === "check" && !existsSync(value)) {
				try {
					statSync(value);
				} catch (e) {
					ctx.addIssue({
						code: "custom",
						message: e.message,
						values: [value],
					});
				}
			}
		});
