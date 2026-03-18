import { defineRules } from "archgate/rules";

export default defineRules({
	"webapp-dockerfile-workspace-packages-in-sync": {
		description:
			"The webapp Dockerfile must COPY exactly the workspace packages declared as dependencies in apps/webapp/package.json.",
		severity: "error",
		async check(ctx) {
			const WEBAPP_PACKAGE_JSON = "apps/webapp/package.json";
			const DOCKERFILE = "apps/webapp/Dockerfile";

			const pkg = (await ctx.readJSON(WEBAPP_PACKAGE_JSON)) as {
				dependencies?: Record<string, string>;
			};

			const declaredPackages = Object.entries(pkg.dependencies ?? {})
				.filter(([, version]) => version === "workspace:*")
				.map(([name]) => name.replace("@packages/", ""))
				.filter((name) => name !== "");

			const copyMatches = await ctx.grepFiles(/COPY\s+\.\/packages\/([^/\s]+)\/src\s/, "**/Dockerfile");
			const copiedPackages = copyMatches
				.map((m) => {
					const match = m.content.match(/COPY\s+\.\/packages\/([^/\s]+)\/src\s/);
					return match?.[1] ?? "";
				})
				.filter((p) => p !== "");

			const missingFromDockerfile = declaredPackages.filter((p) => !copiedPackages.includes(p));
			const extraInDockerfile = copiedPackages.filter((p) => !declaredPackages.includes(p));

			for (const pkg of missingFromDockerfile) {
				ctx.report.violation({
					message: `@packages/${pkg} is declared as a workspace:* dependency in apps/webapp/package.json but has no COPY ./packages/${pkg}/src directive in the Dockerfile.`,
					file: DOCKERFILE,
					fix: `Add COPY ./packages/${pkg}/src, ./packages/${pkg}/package.json, and ./packages/${pkg}/tsconfig.json to the builder stage in ${DOCKERFILE}.`,
				});
			}

			for (const pkg of extraInDockerfile) {
				ctx.report.violation({
					message: `The Dockerfile COPYs ./packages/${pkg}/src but @packages/${pkg} is not declared as a workspace:* dependency in apps/webapp/package.json.`,
					file: DOCKERFILE,
					fix: `Either add @packages/${pkg}: workspace:* to apps/webapp/package.json or remove the COPY ./packages/${pkg}/ directives from ${DOCKERFILE}.`,
				});
			}
		},
	},
});
