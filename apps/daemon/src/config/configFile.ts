import * as assert from "node:assert";
import { basename, extname } from "node:path";
import { merge } from "lodash";
import { FileConfigJsonSchema, FileConfigSchema } from "./fileConfigSchema.ts";

export async function readConfigFile(path: string): Promise<FileConfigSchema | undefined> {
	try {
		const file = Bun.file(path);
		const text = await file.text();
		const extension = extname(basename(path)).toLowerCase();
		assert.ok(extension === ".json");
		return FileConfigSchema.parse(JSON.parse(text));
	} catch (e) {
		console.debug(`Failed to read config file: ${e}`);
		return undefined;
	}
}

export async function writeConfigFile(path: string, overrides: FileConfigSchema) {
	const extension = extname(basename(path)).toLowerCase();
	assert.ok(extension === ".json");
	const _overrides = FileConfigSchema.parse(overrides);

	const $schema = path.replace(/\.json$/, ".schema.json");

	const data = JSON.stringify(merge({ $schema: basename($schema) }, _overrides), null, 2);
	const schemaData = JSON.stringify(FileConfigJsonSchema, null, 2);

	await Bun.write($schema, schemaData);
	await Bun.write(path, data);
}
