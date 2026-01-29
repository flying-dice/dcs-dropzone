import { existsSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { fetchManifest, type ManifestData, readManifest, writeManifest } from "@packages/manifest";

const RELEASE_BASEURL =
	process.env.RELEASE_BASEURL ?? "https://github.com/flying-dice/dcs-dropzone/releases/latest/download";
const DOWNLOAD_ASSET = "dcs-dropzone.tar";
const MANIFEST_PATH = ".manifest";

const stableAssetUrl = join(RELEASE_BASEURL, DOWNLOAD_ASSET);
const stableAssetManifestUrl = `${stableAssetUrl}.manifest`;

console.info(`Checking for updates from ${stableAssetUrl}...`);

console.debug("Fetching latest release manifest...");
const latestReleaseManifest: ManifestData = await fetchManifest(stableAssetManifestUrl);

function getReleaseManifestFolderPath(manifest: ManifestData) {
	return resolve(join(manifest.__version || manifest.createdAt.getTime().toString()));
}

function getReleasePath(manifest: ManifestData, path: string) {
	return resolve(join(getReleaseManifestFolderPath(manifest), path));
}

console.debug("Reading installed release manifest...");
const installedReleaseManifest: ManifestData | undefined = await readManifest(MANIFEST_PATH).catch((e) => {
	console.warn(`Failed to read local manifest, Err: ${e.message}`);
	console.info("Assuming no installed version.");
	return undefined;
});

async function applyUpdate(latest: ManifestData, existing?: ManifestData) {
	console.info("Update available. Downloading new version...");
	const response = await fetch(stableAssetUrl);
	const archive = new Bun.Archive(await response.blob());

	const files = await archive.files();

	for (const [path, file] of files) {
		console.info(`- ${path}`);
		await Bun.write(getReleasePath(latest, path), file);
	}

	if (existing) {
		console.info("Cleaning up old version files...");
		rmSync(getReleaseManifestFolderPath(existing), { force: true, recursive: true });
	}

	console.info("Update downloaded successfully, updating manifest.");
	await writeManifest(MANIFEST_PATH, latestReleaseManifest);
}

if (
	latestReleaseManifest.etag !== installedReleaseManifest?.etag ||
	latestReleaseManifest.files.some((it) => !existsSync(getReleasePath(installedReleaseManifest, it)))
) {
	await applyUpdate(latestReleaseManifest, installedReleaseManifest);
}

const folderName = getReleaseManifestFolderPath(latestReleaseManifest);

const executablePath = resolve(`${folderName}/Dropzone.exe`);

Bun.spawn({
	cmd: [executablePath],
	cwd: folderName,
	env: { ...process.env, DCS_DROPZONE__INSTALL_DIR: resolve(folderName), DCS_DROPZONE__WORKING_DIR: process.cwd() },
	stdout: "inherit",
	stdin: "inherit",
	stderr: "inherit",
});
