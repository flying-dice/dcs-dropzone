import { BuildEnv } from "@packages/dz-config";
import { AppConfig, BuildConfig, EnvConfig } from "./schemas.ts";

const env = BuildEnv.loadWithCurrentEnv(BuildConfig, EnvConfig);

export const appConfig = AppConfig.parse({
	dropzoneTarFile: env.DZ_LAUNCHER_RELEASE_TAR_PATH,
	dropzoneTarFileManifest: env.DZ_LAUNCHER_RELEASE_TAR_MANIFEST_PATH,
	manifestPath: env.DZ_LAUNCHER_MANIFEST,
});
