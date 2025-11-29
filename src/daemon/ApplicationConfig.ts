import { z } from "zod";

const file = Bun.file(`${process.cwd()}/config.toml`);
const text = await file.text();
const config = Bun.TOML.parse(text);

const configSchema = z.object({
	server: z.object({
		host: z.string().default("localhost"),
		port: z.number().int().min(1).max(65535),
	}),
	logging: z.object({
		level: z.enum([
			"fatal",
			"error",
			"warn",
			"info",
			"debug",
			"trace",
			"silent",
		]),
		destination: z.string().optional(),
		colorize: z.boolean(),
	}),
	database: z.object({
		url: z.string(),
	}),
	binaries: z.object({
		target_directory: z.string(),
		wget: z.string().min(1, "wget path is required"),
		sevenzip: z.string().min(1, "7zip path is required"),
	}),
	dcs: z.object({
		dcs_working_dir: z.string().min(1, "DCS working path is required"),
		dcs_install_dir: z.string().min(1, "DCS install path is required"),
	}),
});

export type ApplicationConfig = z.infer<typeof configSchema>;

const appConfig = configSchema.parse(config);

export default appConfig;
