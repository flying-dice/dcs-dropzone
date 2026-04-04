import { defineRules } from "archgate/rules";

export default defineRules({
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
});
