import type { IMissionScriptingFilesManager } from "../IMissionScriptingFilesManager.ts";

export class TestMissionScriptingFilesManager implements IMissionScriptingFilesManager {
	public rebuildCount = 0;

	rebuild(): void {
		this.rebuildCount++;
	}
}
