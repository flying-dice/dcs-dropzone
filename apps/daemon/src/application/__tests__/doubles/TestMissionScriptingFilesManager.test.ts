import { describe, expect, it } from "bun:test";
import { TestMissionScriptingFilesManager } from "./TestMissionScriptingFilesManager.ts";

describe("TestMissionScriptingFilesManager", () => {
	it("has rebuild method", () => {
		const manager = new TestMissionScriptingFilesManager();
		expect(typeof manager.rebuild).toBe("function");
	});

	describe("rebuild", () => {
		it("increments rebuild count", () => {
			const manager = new TestMissionScriptingFilesManager();
			expect(manager.rebuildCount).toBe(0);

			manager.rebuild();
			expect(manager.rebuildCount).toBe(1);

			manager.rebuild();
			expect(manager.rebuildCount).toBe(2);
		});

		it("tracks multiple rebuilds", () => {
			const manager = new TestMissionScriptingFilesManager();

			for (let i = 0; i < 5; i++) {
				manager.rebuild();
			}

			expect(manager.rebuildCount).toBe(5);
		});
	});

	describe("rebuildCount", () => {
		it("starts at zero", () => {
			const manager = new TestMissionScriptingFilesManager();
			expect(manager.rebuildCount).toBe(0);
		});

		it("is publicly accessible for assertions", () => {
			const manager = new TestMissionScriptingFilesManager();
			manager.rebuild();
			expect(manager.rebuildCount).toBeGreaterThan(0);
		});
	});
});
