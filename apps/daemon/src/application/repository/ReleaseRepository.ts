import type { MissionScriptRunOn } from "webapp";
import type { MissionScript } from "../schemas/MissionScript.ts";
import type { MissionScriptByRunOn } from "../schemas/MissionScriptByRunOn.ts";
import type { ModAndReleaseData } from "../schemas/ModAndReleaseData.ts";
import type { ReleaseAsset } from "../schemas/ReleaseAsset.ts";
import type { ReleaseInfo } from "../schemas/ReleaseInfo.ts";
import type { SymbolicLink } from "../schemas/SymbolicLink.ts";

export interface ReleaseRepository {
	saveRelease(data: ModAndReleaseData): void;

	deleteRelease(releaseId: string): void;

	getAllReleases(): ReleaseInfo[];

	getMissionScriptsByRunOn(runOn: MissionScriptRunOn): MissionScriptByRunOn[];

	getReleaseAssetsForRelease(releaseId: string): ReleaseAsset[];

	getSymbolicLinksForRelease(releaseId: string): SymbolicLink[];

	setInstalledPathForSymbolicLink(symbolicLinkId: string, installedPath: string | null): void;

	getMissionScriptsForRelease(releaseId: string): MissionScript[];
}
