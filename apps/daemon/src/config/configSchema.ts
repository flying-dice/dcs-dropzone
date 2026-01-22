import { ze } from "@packages/zod";
import { z } from "zod";

export const ConfigSchema = z.object({
	server: z.object({
		host: z.ipv4(),
		port: z.number().int().min(1).max(65535),
	}),
	database: z.object({
		url: ze.path({ resolve: true, normalize: true, expandEnvVars: true }),
	}),
	binaries: z.object({
		wget: ze.path({ exists: "check", resolve: true, normalize: true, expandEnvVars: true }),
		sevenzip: ze.path({ exists: "check", resolve: true, normalize: true, expandEnvVars: true }),
	}),
	dcs: z.object({
		dcs_working_dir: ze.path({ exists: "check", resolve: true, normalize: true, expandEnvVars: true }),
		dcs_install_dir: ze.path({ exists: "check", resolve: true, normalize: true, expandEnvVars: true }),
	}),
	app: z.object({
		mods_dir: ze.path({ exists: "ensure", resolve: true, normalize: true, expandEnvVars: true }),
		tui_enabled: z.boolean(),
	}),
});

export type ConfigSchema = z.infer<typeof ConfigSchema>;
