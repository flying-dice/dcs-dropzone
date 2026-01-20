import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";

const file = Bun.file(`${process.cwd()}/config.toml`);
const text = await file.text();
const config = Bun.TOML.parse(text);

const configSchema = z
	.object({
		server: z.object({
			host: z.string().default("localhost"),
			port: z.number().int().min(1).max(65535),
		}),
		database: z.object({
			url: z.string(),
		}),
		binaries: z.object({
			wget: z.string().optional(),
			sevenzip: z.string().optional(),
		}),
		dcs: z.object({
			dcs_working_dir: z.string().min(1, "DCS working path is required"),
			dcs_install_dir: z.string().min(1, "DCS install path is required"),
		}),
		app: z.object({
			mods_dir: z.string().min(1, "Mods directory is required"),
			tui_enabled: z.boolean().default(true),
		}),
	})
	.superRefine((data, ctx) => {
		// Validate dcs_working_dir
		const dcsWorkingDir = resolve(data.dcs.dcs_working_dir);
		if (!existsSync(dcsWorkingDir)) {
			ctx.addIssue({
				code: "custom",
				path: ["dcs", "dcs_working_dir"],
				message: `Directory does not exist: ${dcsWorkingDir}`,
			});
		} else {
			try {
				const stats = statSync(dcsWorkingDir);
				if (!stats.isDirectory()) {
					ctx.addIssue({
						code: "custom",
						path: ["dcs", "dcs_working_dir"],
						message: `Path is not a directory: ${dcsWorkingDir}`,
					});
				}
			} catch (e) {
				ctx.addIssue({
					code: "custom",
					path: ["dcs", "dcs_working_dir"],
					message: `Failed to validate directory: ${dcsWorkingDir} - ${e}`,
				});
			}
		}

		// Validate dcs_install_dir
		const dcsInstallDir = resolve(data.dcs.dcs_install_dir);
		if (!existsSync(dcsInstallDir)) {
			ctx.addIssue({
				code: "custom",
				path: ["dcs", "dcs_install_dir"],
				message: `Directory does not exist: ${dcsInstallDir}`,
			});
		} else {
			try {
				const stats = statSync(dcsInstallDir);
				if (!stats.isDirectory()) {
					ctx.addIssue({
						code: "custom",
						path: ["dcs", "dcs_install_dir"],
						message: `Path is not a directory: ${dcsInstallDir}`,
					});
				}
			} catch (e) {
				ctx.addIssue({
					code: "custom",
					path: ["dcs", "dcs_install_dir"],
					message: `Failed to validate directory: ${dcsInstallDir} - ${e}`,
				});
			}
		}

		// Validate mods_dir
		const modsDir = resolve(data.app.mods_dir);
		if (!existsSync(modsDir)) {
			ctx.addIssue({
				code: "custom",
				path: ["app", "mods_dir"],
				message: `Directory does not exist: ${modsDir}`,
			});
		} else {
			try {
				const stats = statSync(modsDir);
				if (!stats.isDirectory()) {
					ctx.addIssue({
						code: "custom",
						path: ["app", "mods_dir"],
						message: `Path is not a directory: ${modsDir}`,
					});
				}
			} catch (e) {
				ctx.addIssue({
					code: "custom",
					path: ["app", "mods_dir"],
					message: `Failed to validate directory: ${modsDir} - ${e}`,
				});
			}
		}
	});

export type AppConfig = z.infer<typeof configSchema>;

// Parse config and export result
const parseResult = configSchema.safeParse(config);

export const configParseResult = parseResult;

// For backward compatibility, export a default config or null
// The index.ts will check configParseResult and handle errors
const appConfig = parseResult.success ? parseResult.data : ({} as AppConfig);

export default appConfig;
