import { z } from "zod";
import { expandEnvVars } from "./utils/expandEnvVars.ts";

const file = Bun.file(`${process.cwd()}/config.toml`);
const text = await file.text();
const config = Bun.TOML.parse(text);

const configSchema = z.object({
	server: z.object({
		host: z.string().default("localhost"),
		port: z.number().int().min(1).max(65535),
	}),
	database: z.object({
		url: z.string().transform(expandEnvVars),
	}),
	binaries: z.object({
		wget: z.string().transform(expandEnvVars).optional(),
		sevenzip: z.string().transform(expandEnvVars).optional(),
	}),
	dcs: z.object({
		dcs_working_dir: z.string().min(1, "DCS working path is required").transform(expandEnvVars),
		dcs_install_dir: z.string().min(1, "DCS install path is required").transform(expandEnvVars),
	}),
	app: z.object({
		mods_dir: z.string().min(1, "Mods directory is required").transform(expandEnvVars),
		tui_enabled: z.boolean().default(true),
	}),
});

const appConfig = configSchema.parse(config);

export default appConfig;
