import { dirname } from "node:path";
import { $ } from "bun";

const packageJsons = new Bun.Glob("{apps,packages}/*/package.json").scanSync();

console.log("Running Per project checks...");

for (const _path of packageJsons) {
	const _parent = dirname(_path);
	const pkg = await Bun.file(_path).json();
	if ("tsc" in pkg.scripts) {
		await $`cd "${_parent}" && bun run tsc`;
	}

	if ("biome" in pkg.scripts) {
		await $`cd "${_parent}" && bun run biome`;
	}

	if ("build" in pkg.scripts) {
		await $`cd "${_parent}" && bun run build`;
	}

	if ("depcheck" in pkg.scripts) {
		console.log(`Running depcheck for ${pkg.name}...`);
		await $`cd "${_parent}" && bun run depcheck`;
	}
}

console.log("Running Global Biome checks...");
await $`bunx biome ci`;

console.log("Running Global Tests...");
await $`bun test`;

console.log("Code checks completed successfully.");
