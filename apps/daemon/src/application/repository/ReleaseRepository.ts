import type { MissionScriptRunOn, SymbolicLinkDestRoot } from "webapp";
import type { ModAndReleaseData } from "../schemas/ModAndReleaseData.ts";

export interface ReleaseRepository {
	saveRelease(data: ModAndReleaseData): void;

	deleteRelease(releaseId: string): void;

	getAllReleases(): {
		releaseId: string;
		modId: string;
		modName: string;
		version: string;
		versionHash: string;
		dependencies: string[];
	}[];

	getMissionScriptsByRunOn(
		runOn: MissionScriptRunOn,
	): { modName: string; modVersion: string; path: string; pathRoot: SymbolicLinkDestRoot }[];

	getReleaseAssetsForRelease(
		releaseId: string,
	): { id: string; releaseId: string; name: string; isArchive: boolean; urls: string[] }[];

	getSymbolicLinksForRelease(releaseId: string): {
		id: string;
		releaseId: string;
		name: string;
		src: string;
		dest: string;
		destRoot: SymbolicLinkDestRoot;
		installedPath: string | null;
	}[];

	setInstalledPathForSymbolicLink(symbolicLinkId: string, installedPath: string | null): void;

	getMissionScriptsForRelease(releaseId: string): {
		id: string;
		releaseId: string;
		name: string;
		purpose: string;
		path: string;
		root: SymbolicLinkDestRoot;
		runOn: MissionScriptRunOn;
		installedPath: string | null;
	}[];
}
