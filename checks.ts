import { dirname } from "node:path";
import { checkbox } from "@inquirer/prompts";
import { $ } from "bun";

type Check = "tsc" | "biome" | "build" | "depcheck" | "tests" | "biome-global" | "archgate" | "playwright";

const ALL_CHECKS: Check[] = ["tsc", "biome", "build", "depcheck", "tests", "biome-global", "archgate", "playwright"];

const isInteractive = process.stdin.isTTY;

const packageJsons = [...new Bun.Glob("{apps,packages}/*/package.json").scanSync()];
const allProjects = await Promise.all(packageJsons.map(async (path) => ({ path, pkg: await Bun.file(path).json() })));

let enabledProjects: string[];
let enabled: Check[];

if (isInteractive) {
	enabledProjects = await checkbox({
		message: "Select projects to check",
		choices: allProjects.map(({ path, pkg }) => ({ name: pkg.name, value: path })),
	});
	enabled = await checkbox({
		message: "Select checks to run",
		choices: [
			{ name: "TypeScript (tsc)", value: "tsc" as Check },
			{ name: "Biome (per-project)", value: "biome" as Check },
			{ name: "Build", value: "build" as Check },
			{ name: "Depcheck", value: "depcheck" as Check },
			{ name: "Tests", value: "tests" as Check },
			{ name: "Biome (global)", value: "biome-global" as Check },
			{ name: "Archgate", value: "archgate" as Check },
			{ name: "Playwright", value: "playwright" as Check },
		],
	});
} else {
	enabledProjects = packageJsons;
	enabled = ALL_CHECKS;
}

const selectedProjects = new Set(enabledProjects);
const selectedChecks = new Set<Check>(enabled);

console.log("Running Per project checks...");

for (const { path, pkg } of allProjects) {
	if (!selectedProjects.has(path)) continue;

	const _parent = dirname(path);

	if (selectedChecks.has("tsc") && "tsc" in pkg.scripts) {
		await $`bun run tsc`.cwd(_parent);
	}

	if (selectedChecks.has("biome") && "biome" in pkg.scripts) {
		await $`bun run biome`.cwd(_parent);
	}

	if (selectedChecks.has("build") && "build" in pkg.scripts) {
		await $`bun run build`.cwd(_parent);
	}

	if (selectedChecks.has("depcheck") && "depcheck" in pkg.scripts) {
		console.log(`Running depcheck for ${pkg.name}...`);
		await $`bun run depcheck`.cwd(_parent);
	}

	if (selectedChecks.has("tests") && "tests" in pkg.scripts) {
		console.log(`Running tests for ${pkg.name}...`);
		await $`bun run tests`.cwd(_parent);
	}
}

if (selectedChecks.has("biome-global")) {
	console.log("Running Global Biome checks...");
	await $`bunx biome ci`;
}

if (selectedChecks.has("archgate")) {
	console.log("Running archgate checks...");
	await $`bun run check:adrs`;
}

if (selectedChecks.has("playwright")) {
	console.log("Running playwright tests...");
	await $`bun run test:playwright`;
}

console.log("Code checks completed successfully.");
