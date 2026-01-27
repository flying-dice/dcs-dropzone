import { z } from "zod";
import { defaultConfig } from "./defaultConfig.ts";

export const FileConfigSchema = z.object({
	server: z
		.object({
			host: z
				.ipv4()
				.meta({ default: defaultConfig.server.host })
				.optional()
				.describe("The IP address the server will bind to"),
			port: z
				.number()
				.int()
				.min(1)
				.max(65535)
				.meta({
					default: defaultConfig.server.port,
				})
				.optional()
				.describe("The port the server will listen on"),
		})
		.optional()
		.describe("Server Configuration"),
	database: z
		.object({
			url: z
				.string()
				.meta({ default: defaultConfig.database.url })
				.optional()
				.describe("The SQLite database file path"),
		})
		.optional()
		.describe("Database Configuration"),
	binaries: z
		.object({
			wget: z
				.string()
				.meta({ default: defaultConfig.binaries.wget })
				.optional()
				.describe("Path to the wget binary, if not provided the system path will be used"),
			sevenzip: z
				.string()
				.meta({ default: defaultConfig.binaries.sevenzip })
				.optional()
				.describe("Path to the 7z binary, if not provided the system path will be used"),
		})
		.optional()
		.describe("Third Party Binaries Configuration"),
	dcs: z
		.object({
			dcs_working_dir: z
				.string()
				.meta({ default: defaultConfig.dcs.dcs_working_dir })
				.optional()
				.describe("Path to DCS working directory"),
			dcs_install_dir: z
				.string()
				.meta({ default: defaultConfig.dcs.dcs_install_dir })
				.optional()
				.describe("Path to DCS installation directory"),
		})
		.optional()
		.describe("DCS World Configuration"),
	app: z
		.object({
			mods_dir: z
				.string()
				.meta({ default: defaultConfig.app.mods_dir })
				.optional()
				.describe("The directory where mods will be stored"),
		})
		.optional()
		.describe("Application Configuration"),
});

export const FileConfigJsonSchema = FileConfigSchema.toJSONSchema({
	unrepresentable: "throw",
	target: "draft-07",
	cycles: "ref",
});

export type FileConfigSchema = z.infer<typeof FileConfigSchema>;
