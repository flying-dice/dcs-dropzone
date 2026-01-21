import "./log4js.ts";
import { exists, symlink, unlink } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fetchManifest, readManifest, writeManifest } from "@packages/manifest";
import { getLogger } from "log4js";

const STABLE_LATEST_URL = "https://github.com/flying-dice/dcs-dropzone/releases/latest";
const DOWNLOAD_ASSET = "dcs-dropzone-daemon.tar";
const MANIFEST_PATH = ".manifest";

const stableAssetUrl = `${STABLE_LATEST_URL}/download/${DOWNLOAD_ASSET}`;
const stableAssetManifestUrl = `${stableAssetUrl}.manifest`;

const SYMLINKS = ["appd.exe", ".manifest", "bin", "config.toml"];

const logger = getLogger("Launcher");

logger.info(`Checking for updates from ${stableAssetUrl}...`);

logger.debug("Fetching latest release manifest...");
const latestReleaseManifest = await fetchManifest(stableAssetManifestUrl);

function getLatestReleasePath(path: string) {
	return resolve(join(latestReleaseManifest.createdAt.getTime().toString(), path));
}

logger.debug("Reading installed release manifest...");
const installedReleaseManifest = await readManifest(MANIFEST_PATH).catch((e) => {
	logger.warn(`Failed to read local manifest, Err: ${e.message}`);
	logger.info("Assuming no installed version.");
});

if (latestReleaseManifest.etag === installedReleaseManifest?.etag) {
	logger.info("No updates available. Exiting.");
	process.exit(0);
}

logger.info("Update available. Downloading new version...");
const response = await fetch(stableAssetUrl);
const archive = new Bun.Archive(await response.blob());

const files = await archive.files();

for (const [path, file] of files) {
	logger.info(`${path}`);
	await Bun.write(getLatestReleasePath(path), file);
}

for (const symlinkPath of SYMLINKS) {
	const _path = symlinkPath;
	const _target = getLatestReleasePath(symlinkPath);

	if (await exists(_path)) {
		logger.debug("Removing existing symlink:", _path);
		await unlink(_path);
	}
	logger.debug(`Creating symlink: ${_path} -> ${_target}`);
	await symlink(_target, _path, "file");
}

logger.info("Update downloaded successfully, updating manifest.");
await writeManifest(getLatestReleasePath(MANIFEST_PATH), latestReleaseManifest);
