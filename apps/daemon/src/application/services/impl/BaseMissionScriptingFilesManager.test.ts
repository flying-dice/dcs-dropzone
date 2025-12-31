import { describe, expect, it } from "bun:test";
import { ok } from "node:assert";
import { join } from "node:path";
import { MissionScriptRunOn, SymbolicLinkDestRoot } from "webapp";
import { zocker } from "zocker";
import { TestReleaseRepository } from "../../repository/impl/TestReleaseRepository.ts";
import { MissionScriptByRunOn } from "../../schemas/MissionScriptByRunOn.ts";
import { BaseMissionScriptingFilesManager } from "./BaseMissionScriptingFilesManager.ts";
import { TestFileSystem } from "./TestFileSystem.ts";
import { TestPathResolver } from "./TestPathResolver.ts";

function createTestContext() {
	const fileSystem = new TestFileSystem();
	const pathResolver = new TestPathResolver();
	const releaseRepository = new TestReleaseRepository();

	return {
		fileSystem,
		pathResolver,
		releaseRepository,
		build: () =>
			new BaseMissionScriptingFilesManager({
				fileSystem,
				pathResolver,
				releaseRepository,
			}),
	};
}

describe("BaseMissionScriptingFilesManager", () => {
	describe("rebuild", () => {
		it("writes the before/after sanitize mission scripting files (snapshot)", () => {
			const c = createTestContext();

			const beforeScriptA = zocker(MissionScriptByRunOn)
				.supply(MissionScriptByRunOn.shape.modName, "modA")
				.supply(MissionScriptByRunOn.shape.modVersion, "1.0.0")
				.supply(MissionScriptByRunOn.shape.path, "Mods/modA/Scripts/a.lua")
				.supply(MissionScriptByRunOn.shape.pathRoot, SymbolicLinkDestRoot.DCS_INSTALL_DIR)
				.generate();
			const beforeScriptB = zocker(MissionScriptByRunOn)
				.supply(MissionScriptByRunOn.shape.modName, "modB")
				.supply(MissionScriptByRunOn.shape.modVersion, "2.0.0")
				.supply(MissionScriptByRunOn.shape.path, "SavedGames/modB/Scripts/b.lua")
				.supply(MissionScriptByRunOn.shape.pathRoot, SymbolicLinkDestRoot.DCS_WORKING_DIR)
				.generate();
			const beforeScripts = [beforeScriptA, beforeScriptB];

			const afterScriptC = zocker(MissionScriptByRunOn)
				.supply(MissionScriptByRunOn.shape.modName, "modC")
				.supply(MissionScriptByRunOn.shape.modVersion, "3.0.0")
				.supply(MissionScriptByRunOn.shape.path, "Mods/modC/Scripts/c.lua")
				.supply(MissionScriptByRunOn.shape.pathRoot, SymbolicLinkDestRoot.DCS_INSTALL_DIR)
				.generate();
			const afterScripts = [afterScriptC];

			c.releaseRepository.getMissionScriptsByRunOn.mockImplementation((runOn) => {
				switch (runOn) {
					case MissionScriptRunOn.MISSION_START_BEFORE_SANITIZE:
						return beforeScripts;
					case MissionScriptRunOn.MISSION_START_AFTER_SANITIZE:
						return afterScripts;
					default:
						return [];
				}
			});

			c.pathResolver.resolveSymbolicLinkPath.mockImplementation((root, path) => {
				switch (root) {
					case SymbolicLinkDestRoot.DCS_INSTALL_DIR:
						return `/DCS_INSTALL_DIR/${path}`;
					case SymbolicLinkDestRoot.DCS_WORKING_DIR:
						return `/DCS_WORKING_DIR/${path}`;
					default:
						return `/${path}`;
				}
			});

			const mgr = c.build();
			mgr.rebuild();

			expect(c.releaseRepository.getMissionScriptsByRunOn).toHaveBeenCalledWith(
				MissionScriptRunOn.MISSION_START_BEFORE_SANITIZE,
			);
			expect(c.releaseRepository.getMissionScriptsByRunOn).toHaveBeenCalledWith(
				MissionScriptRunOn.MISSION_START_AFTER_SANITIZE,
			);

			expect(c.fileSystem.writeFile).toHaveBeenCalledTimes(2);
			const [firstCall, secondCall] = c.fileSystem.writeFile.mock.calls;

			ok(firstCall, "First call to writeFile is undefined");
			ok(secondCall, "Second call to writeFile is undefined");

			expect(firstCall[0]).toEqual(
				join("/DCS_WORKING_DIR", BaseMissionScriptingFilesManager.PATHS.MISSION_START_BEFORE_SANITIZE),
			);
			expect(firstCall[1]).toMatchSnapshot("before sanitize mission scripting file");

			expect(secondCall[0]).toEqual(
				join("/DCS_WORKING_DIR", BaseMissionScriptingFilesManager.PATHS.MISSION_START_AFTER_SANITIZE),
			);
			expect(secondCall[1]).toMatchSnapshot("after sanitize mission scripting file");
		});

		it("should create empty mission scripting files when there are no scripts", () => {
			const c = createTestContext();

			c.releaseRepository.getMissionScriptsByRunOn.mockReturnValue([]);

			c.pathResolver.resolveSymbolicLinkPath.mockImplementation((root, path) => {
				switch (root) {
					case SymbolicLinkDestRoot.DCS_INSTALL_DIR:
						return `/DCS_INSTALL_DIR/${path}`;
					case SymbolicLinkDestRoot.DCS_WORKING_DIR:
						return `/DCS_WORKING_DIR/${path}`;
					default:
						return `/${path}`;
				}
			});

			const mgr = c.build();
			mgr.rebuild();

			expect(c.releaseRepository.getMissionScriptsByRunOn).toHaveBeenCalledWith(
				MissionScriptRunOn.MISSION_START_BEFORE_SANITIZE,
			);
			expect(c.releaseRepository.getMissionScriptsByRunOn).toHaveBeenCalledWith(
				MissionScriptRunOn.MISSION_START_AFTER_SANITIZE,
			);

			expect(c.fileSystem.writeFile).toHaveBeenCalledTimes(2);
			const [firstCall, secondCall] = c.fileSystem.writeFile.mock.calls;

			ok(firstCall, "First call to writeFile is undefined");
			ok(secondCall, "Second call to writeFile is undefined");

			expect(firstCall[0]).toEqual(
				join("/DCS_WORKING_DIR", BaseMissionScriptingFilesManager.PATHS.MISSION_START_BEFORE_SANITIZE),
			);
			expect(firstCall[1]).toMatchSnapshot("before sanitize mission scripting file");

			expect(secondCall[0]).toEqual(
				join("/DCS_WORKING_DIR", BaseMissionScriptingFilesManager.PATHS.MISSION_START_AFTER_SANITIZE),
			);
			expect(secondCall[1]).toMatchSnapshot("after sanitize mission scripting file");
		});
	});
});
