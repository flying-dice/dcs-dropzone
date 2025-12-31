import { mock } from "bun:test";
import type { MissionScriptingFilesManager } from "../MissionScriptingFilesManager.ts";

export class TestMissionScriptingFilesManager implements MissionScriptingFilesManager {
	rebuild = mock<MissionScriptingFilesManager["rebuild"]>();
}
