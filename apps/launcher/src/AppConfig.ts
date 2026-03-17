import { env } from "@packages/dz-config";
import { zen } from "@packages/zod/zen";
import { z } from "zod";

const releasesBaseUrl = env.DZ_RELEASES_BASE_URL ?? "http://localhost:8081/";

export const AppConfig = z.object({
	dropzoneTarFile: z.url(),
	dropzoneTarFileManifest: z.url(),
	manifestPath: zen.path({ resolve: true, normalize: true, expandEnvVars: false }),
});

export type AppConfig = z.infer<typeof AppConfig>;

export const appConfig = AppConfig.parse({
	dropzoneTarFile: env.DZ_DROPZONE_TAR_FILE ?? `${releasesBaseUrl}/dcs-dropzone.tar`,
	dropzoneTarFileManifest: env.DZ_DROPZONE_TAR_FILE_MANIFEST ?? `${releasesBaseUrl}/dcs-dropzone.tar.manifest`,
	manifestPath: env.DZ_MANIFEST_PATH ?? ".manifest",
});
