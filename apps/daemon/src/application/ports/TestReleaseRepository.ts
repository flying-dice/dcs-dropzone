import { mock } from "bun:test";
import type { ReleaseRepository } from "./ReleaseRepository.ts";

export class TestReleaseRepository implements ReleaseRepository {
	getAllReleases = mock<ReleaseRepository["getAllReleases"]>();
	saveRelease = mock<ReleaseRepository["saveRelease"]>();
	deleteRelease = mock<ReleaseRepository["deleteRelease"]>();
	getReleaseAssetsForRelease = mock<ReleaseRepository["getReleaseAssetsForRelease"]>();
	setInstalledPathForSymbolicLink = mock<ReleaseRepository["setInstalledPathForSymbolicLink"]>();
	getMissionScriptsForRelease = mock<ReleaseRepository["getMissionScriptsForRelease"]>();
	getMissionScriptsByRunOn = mock<ReleaseRepository["getMissionScriptsByRunOn"]>();
	getSymbolicLinksForRelease = mock<ReleaseRepository["getSymbolicLinksForRelease"]>();
}
