import type { MissionScriptRunOn } from "webapp";
import type { ReleaseRepository } from "../ports/ReleaseRepository.ts";
import type { MissionScript } from "../schemas/MissionScript.ts";
import type { MissionScriptByRunOn } from "../schemas/MissionScriptByRunOn.ts";
import type { ModAndReleaseData } from "../schemas/ModAndReleaseData.ts";
import type { ReleaseAsset } from "../schemas/ReleaseAsset.ts";
import type { ReleaseInfo } from "../schemas/ReleaseInfo.ts";
import type { SymbolicLink } from "../schemas/SymbolicLink.ts";

export class TestReleaseRepository implements ReleaseRepository {
	private releases = new Map<string, ModAndReleaseData>();
	private installedPaths = new Map<string, string | null>();

	saveRelease(data: ModAndReleaseData): void {
		this.releases.set(data.releaseId, data);
	}

	getAllReleases(): ReleaseInfo[] {
		const releaseInfos: ReleaseInfo[] = [];

		for (const releaseData of this.releases.values()) {
			releaseInfos.push({
				releaseId: releaseData.releaseId,
				modId: releaseData.modId,
				modName: releaseData.modName,
				version: releaseData.version,
				versionHash: releaseData.versionHash,
				dependencies: releaseData.dependencies,
			});
		}

		return releaseInfos;
	}

	getReleaseAssetsForRelease(releaseId: string): ReleaseAsset[] {
		const releaseAssets: ReleaseAsset[] = [];

		for (const releaseData of this.releases.values()) {
			if (releaseData.releaseId === releaseId) {
				for (const releaseAsset of releaseData.assets) {
					releaseAssets.push({
						id: releaseAsset.id,
						releaseId: releaseData.releaseId,
						name: releaseAsset.name,
						isArchive: releaseAsset.isArchive,
						urls: releaseAsset.urls,
					});
				}
			}
		}

		return releaseAssets;
	}

	getSymbolicLinksForRelease(releaseId: string): SymbolicLink[] {
		const symbolicLinks: SymbolicLink[] = [];

		for (const releaseData of this.releases.values()) {
			if (releaseData.releaseId === releaseId) {
				for (const symbolicLink of releaseData.symbolicLinks) {
					symbolicLinks.push({
						id: symbolicLink.id,
						releaseId: releaseData.releaseId,
						name: symbolicLink.name,
						src: symbolicLink.src,
						dest: symbolicLink.dest,
						destRoot: symbolicLink.destRoot,
						installedPath: this.installedPaths.get(symbolicLink.id) ?? null,
					});
				}
			}
		}

		return symbolicLinks;
	}

	setInstalledPathForSymbolicLink(symbolicLinkId: string, installedPath: string | null): void {
		this.installedPaths.set(symbolicLinkId, installedPath);
	}

	getMissionScriptsForRelease(releaseId: string): MissionScript[] {
		const missionScripts: MissionScript[] = [];

		for (const releaseData of this.releases.values()) {
			if (releaseData.releaseId === releaseId) {
				for (const missionScript of releaseData.missionScripts) {
					missionScripts.push({
						id: missionScript.id,
						releaseId: releaseData.releaseId,
						name: missionScript.name,
						purpose: missionScript.purpose,
						path: missionScript.path,
						root: missionScript.root,
						runOn: missionScript.runOn,
						installedPath: this.installedPaths.get(missionScript.id) ?? null,
					});
				}
			}
		}

		return missionScripts;
	}

	getMissionScriptsByRunOn(runOn: MissionScriptRunOn): MissionScriptByRunOn[] {
		const missionScripts: MissionScriptByRunOn[] = [];

		for (const releaseData of this.releases.values()) {
			for (const missionScript of releaseData.missionScripts) {
				if (missionScript.runOn === runOn) {
					missionScripts.push({
						modName: releaseData.modName,
						modVersion: releaseData.version,
						path: missionScript.path,
						pathRoot: missionScript.root,
					});
				}
			}
		}

		return missionScripts;
	}

	deleteRelease(releaseId: string) {
		this.releases.delete(releaseId);
	}
}
