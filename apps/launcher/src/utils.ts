function getLatestReleasePath(path: string) {
	return join(latestReleaseManifest.createdAt.getTime().toString(), path);
}
