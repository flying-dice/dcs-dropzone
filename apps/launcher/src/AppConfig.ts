import { zen } from "@packages/zod/zen";
import { z } from "zod";
import env from "../env.ts";

export const AppConfig = z.object({
	dropzoneTarFile: z.url(),
	dropzoneTarFileManifest: z.url(),
	manifestPath: zen.path({ resolve: true, normalize: true, expandEnvVars: false }),
});

export type AppConfig = z.infer<typeof AppConfig>;

export const appConfig = AppConfig.parse({
	dropzoneTarFile: env.DZ_LAUNCHER_RELEASE_TAR_PATH,
	dropzoneTarFileManifest: env.DZ_LAUNCHER_RELEASE_TAR_MANIFEST_PATH,
	manifestPath: env.DZ_LAUNCHER_MANIFEST,
});
