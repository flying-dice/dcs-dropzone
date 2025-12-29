import type { MissionScriptRunOn, SymbolicLinkDestRoot } from "webapp";
import type { ReleaseRepository } from "../../repository/ReleaseRepository.ts";
import type { ModAndReleaseData } from "../../schemas/ModAndReleaseData.ts";

export class TestReleaseRepository implements ReleaseRepository {
	public savedReleases: ModAndReleaseData[] = [];
	public deletedReleases: string[] = [];
	public symbolicLinkPaths: Map<string, string | null> = new Map();

	private releases: Map<string, ModAndReleaseData> = new Map();
	private assets: Map<
		string,
		Array<{ id: string; releaseId: string; name: string; isArchive: boolean; urls: string[] }>
	> = new Map();
	private symbolicLinks: Map<
		string,
		Array<{
			id: string;
			releaseId: string;
			name: string;
			src: string;
			dest: string;
			destRoot: SymbolicLinkDestRoot;
			installedPath: string | null;
		}>
	> = new Map();
	private missionScripts: Map<
		string,
		Array<{
			id: string;
			releaseId: string;
			name: string;
			purpose: string;
			path: string;
			root: SymbolicLinkDestRoot;
			runOn: MissionScriptRunOn;
			installedPath: string | null;
		}>
	> = new Map();

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

	getAllReleases(): Array<{
		releaseId: string;
		modId: string;
		modName: string;
		version: string;
		versionHash: string;
		dependencies: string[];
	}> {
		return Array.from(this.releases.values()).map((r) => ({
			releaseId: r.releaseId,
			modId: r.modId,
			modName: r.modName,
			version: r.version,
			versionHash: r.versionHash,
			dependencies: r.dependencies,
		}));
	}

	getMissionScriptsByRunOn(
		runOn: MissionScriptRunOn,
	): Array<{ modName: string; modVersion: string; path: string; pathRoot: SymbolicLinkDestRoot }> {
		const result: Array<{ modName: string; modVersion: string; path: string; pathRoot: SymbolicLinkDestRoot }> = [];
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

	getReleaseAssetsForRelease(
		releaseId: string,
	): Array<{ id: string; releaseId: string; name: string; isArchive: boolean; urls: string[] }> {
		return this.assets.get(releaseId) || [];
	}

	getSymbolicLinksForRelease(releaseId: string): Array<{
		id: string;
		releaseId: string;
		name: string;
		src: string;
		dest: string;
		destRoot: SymbolicLinkDestRoot;
		installedPath: string | null;
	}> {
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

	getMissionScriptsForRelease(releaseId: string): Array<{
		id: string;
		releaseId: string;
		name: string;
		purpose: string;
		path: string;
		root: SymbolicLinkDestRoot;
		runOn: MissionScriptRunOn;
		installedPath: string | null;
	}> {
		return this.missionScripts.get(releaseId) || [];
	}
}
