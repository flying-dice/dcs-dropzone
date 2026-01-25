import { zen } from "@packages/zod/zen";
import { z } from "zod";

export const ConfigSchema = z.object({
	server: z.object({
		host: z.ipv4(),
		port: z.number().int().min(1).max(65535),
	}),
	database: z.object({
		url: zen.path({ resolve: true, normalize: true, expandEnvVars: true }),
	}),
	binaries: z.object({
		wget: zen.path({ exists: "check", resolve: true, normalize: true, expandEnvVars: true }),
		sevenzip: zen.path({ exists: "check", resolve: true, normalize: true, expandEnvVars: true }),
	}),
	dcs: z.object({
		dcs_working_dir: zen.path({ exists: "check", resolve: true, normalize: true, expandEnvVars: true }),
		dcs_install_dir: zen.path({ exists: "check", resolve: true, normalize: true, expandEnvVars: true }),
	}),
	app: z.object({
		mods_dir: zen.path({ exists: "ensure", resolve: true, normalize: true, expandEnvVars: true }),
		webapp_url: z.url(),
	}),
});

export type ConfigSchema = z.infer<typeof ConfigSchema>;
