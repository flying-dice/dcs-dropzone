import { defineRules } from "../../node_modules/archgate/src/formats/rules.ts";

export default defineRules({
	"neverthrow-dependency": {
		description: "neverthrow must remain a direct dependency in at least one workspace package.json.",
		severity: "error",
		async check(ctx) {
			const packageFiles = await ctx.glob("{apps,packages}/*/package.json");
			let found = false;

			for (const file of packageFiles) {
				const content = (await ctx.readJSON(file)) as {
					dependencies?: Record<string, string>;
					peerDependencies?: Record<string, string>;
				};

				const deps = { ...content.dependencies, ...content.peerDependencies };
				if (deps.neverthrow) {
					found = true;
					break;
				}
			}

			if (!found) {
				ctx.report.violation({
					message:
						"neverthrow is not listed as a dependency in any workspace package.json. Removal requires a superseding ADR.",
					file: "package.json",
				});
			}
		},
	},

	"no-raw-try-catch": {
		description: "No raw try/catch blocks in src/ outside of fromThrowable / fromPromise wrappers.",
		severity: "error",
		async check(ctx) {
			const matches = await ctx.grepFiles(/\btry\s*\{/, "{apps,packages}/*/src/**/*.ts");
			const filtered = matches.filter((m) => {
				// Exclude test files
				if (m.file.includes(".test.") || m.file.includes("__tests__")) return false;
				return true;
			});

			for (const match of filtered) {
				ctx.report.violation({
					message: `Raw try/catch block found. Wrap third-party throwing code with fromThrowable/fromPromise, or use Result types for recoverable errors.`,
					file: match.file,
					line: match.line,
					fix: "Replace with fromThrowable(), fromPromise(), or return Result/ResultAsync.",
				});
			}
		},
	},

	"error-classes-extend-error": {
		description: "All custom error classes must extend Error.",
		severity: "error",
		async check(ctx) {
			const classMatches = await ctx.grepFiles(
				/class\s+\w*Error\w*\s+(?!extends\s+Error)/,
				"{apps,packages}/*/src/**/*.ts",
			);
			const filtered = classMatches.filter((m) => {
				if (m.file.includes(".test.") || m.file.includes("__tests__")) return false;
				// Allow extending other Error subclasses (e.g., class MyError extends BaseError)
				if (/class\s+\w*Error\w*\s+extends\s+\w*Error/.test(m.content)) return false;
				return true;
			});

			for (const match of filtered) {
				ctx.report.violation({
					message: `Error class does not extend Error: ${match.content.trim()}`,
					file: match.file,
					line: match.line,
					fix: "Ensure the class extends Error (or an Error subclass).",
				});
			}
		},
	},

	"no-unsafe-unwrap-in-source": {
		description: "_unsafeUnwrap() must not appear in src/ outside of test files.",
		severity: "error",
		async check(ctx) {
			const matches = await ctx.grepFiles(/\._unsafeUnwrap\s*\(/, "{apps,packages}/*/src/**/*.ts");
			const filtered = matches.filter((m) => {
				if (m.file.includes(".test.") || m.file.includes("__tests__")) return false;
				return true;
			});

			for (const match of filtered) {
				ctx.report.violation({
					message: `_unsafeUnwrap() found in source code. Use .match(), .andThen(), or .map() instead.`,
					file: match.file,
					line: match.line,
					fix: "Replace _unsafeUnwrap() with .match(ok, err), .andThen(), or .map().",
				});
			}
		},
	},
});
