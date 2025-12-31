import { mock } from "bun:test";
import type { ReleaseRepository } from "./ReleaseRepository.ts";

export class TestReleaseRepository implements ReleaseRepository {
	getAllReleases = mock();
	saveRelease = mock();
	deleteRelease = mock();
	getReleaseAssetsForRelease = mock();
	setInstalledPathForSymbolicLink = mock();
	getMissionScriptsForRelease = mock();
	getMissionScriptsByRunOn = mock();
	getSymbolicLinksForRelease = mock();
}
