import type { MissionScriptRunOn } from "webapp";
import type { ReleaseRepository } from "../../repository/ReleaseRepository.ts";
import type {
	MissionScript,
	MissionScriptByRunOn,
	ReleaseAsset,
	ReleaseInfo,
	SymbolicLink,
} from "../../repository/types.ts";
import type { ModAndReleaseData } from "../../schemas/ModAndReleaseData.ts";

export class TestReleaseRepository implements ReleaseRepository {
	public savedReleases: ModAndReleaseData[] = [];
	public deletedReleases: string[] = [];
	public symbolicLinkPaths: Map<string, string | null> = new Map();

	private releases: Map<string, ModAndReleaseData> = new Map();
	private assets: Map<string, ReleaseAsset[]> = new Map();
	private symbolicLinks: Map<string, SymbolicLink[]> = new Map();
	private missionScripts: Map<string, MissionScript[]> = new Map();

	saveRelease(data: ModAndReleaseData): void {
		this.savedReleases.push(data);
		this.releases.set(data.releaseId, data);
		this.assets.set(
			data.releaseId,
			data.assets.map((a) => ({
				id: `${data.releaseId}-${a.name}`,
				releaseId: data.releaseId,
				name: a.name,
				isArchive: a.isArchive,
				urls: a.urls,
			})),
		);
		this.symbolicLinks.set(
			data.releaseId,
			data.symbolicLinks.map((s, idx) => ({
				id: `${data.releaseId}-link-${idx}`,
				releaseId: data.releaseId,
				name: s.name,
				src: s.src,
				dest: s.dest,
				destRoot: s.destRoot,
				installedPath: null,
			})),
		);
		this.missionScripts.set(
			data.releaseId,
			data.missionScripts.map((m, idx) => ({
				id: `${data.releaseId}-script-${idx}`,
				releaseId: data.releaseId,
				name: m.name,
				purpose: m.purpose,
				path: m.path,
				root: m.root,
				runOn: m.runOn,
				installedPath: null,
			})),
		);
	}

	deleteRelease(releaseId: string): void {
		this.deletedReleases.push(releaseId);
		this.releases.delete(releaseId);
		this.assets.delete(releaseId);
		this.symbolicLinks.delete(releaseId);
		this.missionScripts.delete(releaseId);
	}

	getAllReleases(): ReleaseInfo[] {
		return Array.from(this.releases.values()).map((r) => ({
			releaseId: r.releaseId,
			modId: r.modId,
			modName: r.modName,
			version: r.version,
			versionHash: r.versionHash,
			dependencies: r.dependencies,
		}));
	}

	getMissionScriptsByRunOn(runOn: MissionScriptRunOn): MissionScriptByRunOn[] {
		const result: MissionScriptByRunOn[] = [];
		for (const release of this.releases.values()) {
			const scripts = this.missionScripts.get(release.releaseId) || [];
			for (const script of scripts) {
				if (script.runOn === runOn) {
					result.push({
						modName: release.modName,
						modVersion: release.version,
						path: script.path,
						pathRoot: script.root,
					});
				}
			}
		}
		return result;
	}

	getReleaseAssetsForRelease(releaseId: string): ReleaseAsset[] {
		return this.assets.get(releaseId) || [];
	}

	getSymbolicLinksForRelease(releaseId: string): SymbolicLink[] {
		return this.symbolicLinks.get(releaseId) || [];
	}

	setInstalledPathForSymbolicLink(symbolicLinkId: string, installedPath: string | null): void {
		this.symbolicLinkPaths.set(symbolicLinkId, installedPath);
		for (const links of this.symbolicLinks.values()) {
			for (const link of links) {
				if (link.id === symbolicLinkId) {
					link.installedPath = installedPath;
				}
			}
		}
	}

	getMissionScriptsForRelease(releaseId: string): MissionScript[] {
		return this.missionScripts.get(releaseId) || [];
	}
}
