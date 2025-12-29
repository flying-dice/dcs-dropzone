import type { MissionScriptingFilesManager } from "../MissionScriptingFilesManager.ts";

export class TestMissionScriptingFilesManager implements MissionScriptingFilesManager {
	public rebuildCount = 0;

	rebuild(): void {
		this.rebuildCount++;
	}
}
