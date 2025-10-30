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
});

export type AppConfig = z.infer<typeof configSchema>;

const appConfig = configSchema.parse(config);

export default appConfig;
