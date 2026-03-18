import type { BuildConfig } from "../src/config/schemas.ts";

export const envLocalBuild: BuildConfig = {
	DZ_LAUNCHER_RELEASE_TAR_PATH: "http://localhost:8081/dcs-dropzone.tar",
	DZ_LAUNCHER_RELEASE_TAR_MANIFEST_PATH: "http://localhost:8081/dcs-dropzone.tar.manifest",
	DZ_LAUNCHER_MANIFEST: ".manifest",
};

export const envProdBuild: BuildConfig = {
	DZ_LAUNCHER_RELEASE_TAR_PATH: "https://github.com/flying-dice/dcs-dropzone/releases/latest/download/dcs-dropzone.tar",
	DZ_LAUNCHER_RELEASE_TAR_MANIFEST_PATH: "https://github.com/flying-dice/dcs-dropzone/releases/latest/download/dcs-dropzone.tar.manifest",
	DZ_LAUNCHER_MANIFEST: ".manifest",
};
