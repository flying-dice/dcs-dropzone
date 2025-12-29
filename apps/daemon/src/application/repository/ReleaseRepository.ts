import type { MissionScriptRunOn } from "webapp";
import type { ModAndReleaseData } from "../schemas/ModAndReleaseData.ts";
import type { MissionScript, MissionScriptByRunOn, ReleaseAsset, ReleaseInfo, SymbolicLink } from "./types.ts";

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
