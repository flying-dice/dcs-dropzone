import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { fetchManifest, readManifest, writeManifest } from "@packages/manifest";

const RELEASE_BASEURL =
	process.env.RELEASE_BASEURL ?? "https://github.com/flying-dice/dcs-dropzone/releases/latest/download";
const DOWNLOAD_ASSET = "dcs-dropzone-daemon.tar";
const MANIFEST_PATH = ".manifest";

const stableAssetUrl = join(RELEASE_BASEURL, DOWNLOAD_ASSET);
const stableAssetManifestUrl = `${stableAssetUrl}.manifest`;

console.info(`Checking for updates from ${stableAssetUrl}...`);

console.debug("Fetching latest release manifest...");
const latestReleaseManifest = await fetchManifest(stableAssetManifestUrl);
const folderName = latestReleaseManifest.__version || latestReleaseManifest.createdAt.getTime().toString();

function getLatestReleasePath(path: string) {
	return resolve(join(folderName, path));
}

console.debug("Reading installed release manifest...");
const installedReleaseManifest = await readManifest(MANIFEST_PATH).catch((e) => {
	console.warn(`Failed to read local manifest, Err: ${e.message}`);
	console.info("Assuming no installed version.");
});

async function applyUpdate() {
	console.info("Update available. Downloading new version...");
	const response = await fetch(stableAssetUrl);
	const archive = new Bun.Archive(await response.blob());

	const files = await archive.files();

	for (const [path, file] of files) {
		console.info(`- ${path}`);
		await Bun.write(getLatestReleasePath(path), file);
	}

	console.info("Update downloaded successfully, updating manifest.");
	await writeManifest(MANIFEST_PATH, latestReleaseManifest);
}

if (
	latestReleaseManifest.etag !== installedReleaseManifest?.etag ||
	latestReleaseManifest.files.some((it) => !existsSync(join(folderName, it)))
) {
	await applyUpdate();
}

const executablePath = resolve(`${folderName}/appd.exe`);

Bun.spawn({
	cmd: [executablePath],
	cwd: folderName,
	env: { ...process.env, DCS_DROPZONE__INSTALL_DIR: resolve(folderName), DCS_DROPZONE__WORKING_DIR: process.cwd() },
	stdout: "inherit",
	stdin: "inherit",
	stderr: "inherit",
});
