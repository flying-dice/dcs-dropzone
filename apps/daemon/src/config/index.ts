import * as assert from "node:assert";
import { getShapeFromZodObject } from "@packages/zod/ze";
import inquirer from "inquirer";
import { get, merge } from "lodash";
import { ZodOptional, type ZodType, z } from "zod";
import { readConfigFile, writeConfigFile } from "./configFile.ts";
import { ConfigSchema } from "./configSchema.ts";
import { FileConfigSchema } from "./fileConfigSchema.ts";
import { CONFIG_FILE_PATH, defaultConfig } from "./utils.ts";

// biome-ignore lint/style/useConst: Required for while loop below
let appConfig: ConfigSchema;
let _appConfig: ConfigSchema | null = null;

// Configuration Loading
while (!_appConfig) {
	console.log(`Loading Configuration File: ${CONFIG_FILE_PATH}`);
	const configFile = await readConfigFile(CONFIG_FILE_PATH);
	const configWithDefaults = merge({}, defaultConfig, configFile);
	const parseResult = ConfigSchema.safeParse(configWithDefaults);

	if (parseResult.success) {
		await writeConfigFile(CONFIG_FILE_PATH, configFile || {});
		_appConfig = parseResult.data;
	} else {
		console.error("Failed to load configuration:");

		console.table(
			parseResult.error.issues.map((it) => ({
				Path: it.path.join("."),
				Value: get(configWithDefaults, it.path),
				Error: it.message,
			})),
		);

		console.log("Updating Failed Config Values...");

		const answers = await inquirer.prompt(
			parseResult.error.issues.map((issue) => ({
				type: "input",
				name: issue.path.join("."),
				message: `${issue.path.join(".")}`,
				default: () => {
					const p = issue.path.map(String);
					const shape = getShapeFromZodObject(FileConfigSchema, p);
					return (shape instanceof ZodOptional ? (shape.unwrap() as ZodType) : shape)?.meta()?.default;
				},
				validate: (it) => {
					const shape = getShapeFromZodObject(ConfigSchema, issue.path);
					if (shape) {
						const parseResult = shape.safeParse(it);
						if (parseResult.error) {
							return z.treeifyError(parseResult.error).errors;
						}
					}

					return true;
				},
			})),
		);

		console.log("Updating config file and reloading...");
		await writeConfigFile(CONFIG_FILE_PATH, merge(configFile, answers));
	}
}

assert.ok(_appConfig);
appConfig = _appConfig;
export default appConfig;
