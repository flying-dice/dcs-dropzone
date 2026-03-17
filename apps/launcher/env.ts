import { env } from "@packages/dz-config";
import { z } from "zod";

export const EnvConfig = z.object({
	DZ_LAUNCHER_RELEASE_TAR_PATH: z.url(),
	DZ_LAUNCHER_RELEASE_TAR_MANIFEST_PATH: z.url(),
	DZ_LAUNCHER_MANIFEST: z.string(),
});

export type EnvConfig = typeof EnvConfig;

export default EnvConfig.parse(env);
