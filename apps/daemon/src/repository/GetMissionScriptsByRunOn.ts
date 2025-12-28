import type { MissionScriptRunOn, SymbolicLinkDestRoot } from "webapp";

export interface GetMissionScriptsByRunOn {
	execute(runOn: MissionScriptRunOn): {
		modName: string;
		modVersion: string;
		path: string;
		pathRoot: SymbolicLinkDestRoot;
	}[];
}
