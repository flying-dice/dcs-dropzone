import type { T_MOD_RELEASE_SYMBOLIC_LINKS } from "../daemon/database/schema.ts";
import { AssetStatus, DownloadedReleaseStatus } from "./data.ts";

export function inferReleaseStatusFromAssets(
	assetStatus: AssetStatus[],
	symbolicLinksData: (typeof T_MOD_RELEASE_SYMBOLIC_LINKS.$inferSelect)[],
): DownloadedReleaseStatus {
	if (assetStatus.every((it) => it === AssetStatus.PENDING)) {
		return DownloadedReleaseStatus.PENDING;
	}

	if (assetStatus.some((it) => it === AssetStatus.ERROR)) {
		return DownloadedReleaseStatus.ERROR;
	}

	if (assetStatus.every((it) => it === AssetStatus.COMPLETED)) {
		return symbolicLinksData.every((it) => it.installedPath)
			? DownloadedReleaseStatus.ENABLED
			: DownloadedReleaseStatus.DISABLED;
	}

	return DownloadedReleaseStatus.IN_PROGRESS;
}
