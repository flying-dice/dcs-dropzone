import type { T_MOD_RELEASE_SYMBOLIC_LINKS } from "../daemon/database/schema.ts";
import { AssetStatus, SubscribedReleaseStatus } from "./data.ts";

export function inferReleaseStatusFromAssets(
	assetStatus: AssetStatus[],
	symbolicLinksData: (typeof T_MOD_RELEASE_SYMBOLIC_LINKS.$inferSelect)[],
): SubscribedReleaseStatus {
	if (assetStatus.every((it) => it === AssetStatus.PENDING)) {
		return SubscribedReleaseStatus.PENDING;
	}

	if (assetStatus.some((it) => it === AssetStatus.ERROR)) {
		return SubscribedReleaseStatus.ERROR;
	}

	if (assetStatus.every((it) => it === AssetStatus.COMPLETED)) {
		return symbolicLinksData.every((it) => it.installedPath)
			? SubscribedReleaseStatus.ENABLED
			: SubscribedReleaseStatus.DISABLED;
	}

	return SubscribedReleaseStatus.IN_PROGRESS;
}
