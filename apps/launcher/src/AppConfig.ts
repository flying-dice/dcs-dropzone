import { RcConfig } from "@packages/rc-config";
import { zen } from "@packages/zod/zen";
import { z } from "zod";
import { env } from "../env.ts";

export const Constants = z.object({
	ReleasesBaseUrl: z.url().default("http://localhost:8081/"),
});

export type Constants = z.infer<typeof Constants>;

export const constants = Constants.parse({
	ReleasesBaseUrl: env.DZ_RELEASES_BASE_URL,
});

export const AppConfig = z.object({
	dropzoneTarFile: z.url(),
	dropzoneTarFileManifest: z.url(),
	manifestPath: zen.path({ resolve: true, normalize: true, expandEnvVars: false }),
});

export type AppConfig = z.infer<typeof AppConfig>;

export const appConfig = new RcConfig<AppConfig>("DropzoneLauncher", AppConfig, {
	dropzoneTarFile: `${constants.ReleasesBaseUrl}/dcs-dropzone.tar`,
	dropzoneTarFileManifest: `${constants.ReleasesBaseUrl}/dcs-dropzone.tar.manifest`,
	manifestPath: ".manifest",
});
