import type { MissionScriptRunOn, SymbolicLinkDestRoot } from "webapp";

export interface GetMissionScriptsForReleaseId {
	execute(releaseId: string): {
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
