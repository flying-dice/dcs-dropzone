import { MissionScriptingFilesManager } from "../../services/MissionScriptingFilesManager.ts";

export class TestMissionScriptingFilesManager {
	public rebuildCount = 0;

	rebuild(): void {
		this.rebuildCount++;
	}
}
