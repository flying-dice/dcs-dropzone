import { AssetStatus } from "../enums/AssetStatus.ts";
import { DownloadedReleaseStatus } from "../enums/DownloadedReleaseStatus.ts";

export function inferReleaseStatusFromAssets(
	assetStatus: AssetStatus[],
	enabled: boolean,
	symlinkIntegrityValid: boolean = true,
): DownloadedReleaseStatus {
	if (assetStatus.length > 0 && assetStatus.every((it) => it === AssetStatus.PENDING)) {
		return DownloadedReleaseStatus.PENDING;
	}

	if (assetStatus.some((it) => it === AssetStatus.ERROR)) {
		return DownloadedReleaseStatus.ERROR;
	}

	if (assetStatus.every((it) => it === AssetStatus.COMPLETED)) {
		if (enabled && !symlinkIntegrityValid) {
			return DownloadedReleaseStatus.INCONSISTENT;
		}
		return enabled ? DownloadedReleaseStatus.ENABLED : DownloadedReleaseStatus.DISABLED;
	}

	return DownloadedReleaseStatus.IN_PROGRESS;
}
