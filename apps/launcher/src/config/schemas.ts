import { zen } from "@packages/zod/zen";
import { z } from "zod";

export const AppConfig = z.object({
	dropzoneTarFile: z.url(),
	dropzoneTarFileManifest: z.url(),
	manifestPath: zen.path({ resolve: true, normalize: true, expandEnvVars: false }),
});

export type AppConfig = z.infer<typeof AppConfig>;

export const EnvConfig = z.object({
	DZ_LAUNCHER_RELEASE_TAR_PATH: z.url(),
	DZ_LAUNCHER_RELEASE_TAR_MANIFEST_PATH: z.url(),
	DZ_LAUNCHER_MANIFEST: z.string(),
});

export type EnvConfig = z.infer<typeof EnvConfig>;

export const BuildConfig = EnvConfig.omit({});

export type BuildConfig = z.infer<typeof BuildConfig>;
