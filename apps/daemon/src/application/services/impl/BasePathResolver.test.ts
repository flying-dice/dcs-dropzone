import { describe, expect, it } from "bun:test";
import { join } from "node:path";
import { faker } from "@faker-js/faker";
import { SymbolicLinkDestRoot } from "webapp";
import { BasePathResolver } from "./BasePathResolver.ts";
import { TestFileSystem } from "./TestFileSystem.ts";

function createTestContext() {
	const fileSystem = new TestFileSystem();
	fileSystem.resolve.mockImplementation((...parts: string[]) => join(...parts));

	const dropzoneModsFolder = faker.system.directoryPath();
	const dcsInstallDir = faker.system.directoryPath();
	const dcsWorkingDir = faker.system.directoryPath();

	return {
		fileSystem,
		dropzoneModsFolder,
		dcsInstallDir,
		dcsWorkingDir,
		build: () =>
			new BasePathResolver({
				fileSystem,
				dropzoneModsFolder,
				dcsInstallDir,
				dcsWorkingDir,
			}),
	};
}

describe("BasePathResolver", () => {
	describe("resolveReleasePath", () => {
		it("resolves to the release root when path is omitted", () => {
			const c = createTestContext();
			const releaseId = faker.string.uuid();

			const resolver = c.build();
			const result = resolver.resolveReleasePath(releaseId);

			expect(result).toBe(join(c.dropzoneModsFolder, releaseId));
			expect(c.fileSystem.resolve).toHaveBeenCalledWith(c.dropzoneModsFolder, releaseId);
		});

		it("resolves to a nested file within the release when path is provided", () => {
			const c = createTestContext();
			const releaseId = faker.string.uuid();
			const subPath = "nested/file.txt";

			const resolver = c.build();
			const result = resolver.resolveReleasePath(releaseId, subPath);

			expect(result).toBe(join(c.dropzoneModsFolder, releaseId, subPath));
			expect(c.fileSystem.resolve).toHaveBeenCalledWith(c.dropzoneModsFolder, releaseId, subPath);
		});
	});

	describe("resolveSymbolicLinkPath", () => {
		it("resolves using the DCS install dir when path is omitted", () => {
			const c = createTestContext();

			const resolver = c.build();
			const result = resolver.resolveSymbolicLinkPath(SymbolicLinkDestRoot.DCS_INSTALL_DIR);

			expect(result).toBe(c.dcsInstallDir);
			expect(c.fileSystem.resolve).toHaveBeenCalledWith(c.dcsInstallDir);
		});

		it("resolves using the DCS working dir with an additional path", () => {
			const c = createTestContext();
			const subPath = "Scripts/myscript.lua";

			const resolver = c.build();
			const result = resolver.resolveSymbolicLinkPath(SymbolicLinkDestRoot.DCS_WORKING_DIR, subPath);

			expect(result).toBe(join(c.dcsWorkingDir, subPath));
			expect(c.fileSystem.resolve).toHaveBeenCalledWith(c.dcsWorkingDir, subPath);
		});

		it("throws when an unknown dest root is provided", () => {
			const c = createTestContext();
			const resolver = c.build();
			const badRoot = "UNKNOWN_ROOT" as unknown as SymbolicLinkDestRoot;

			expect(() => resolver.resolveSymbolicLinkPath(badRoot)).toThrowError(
				`Path for destRoot ${badRoot} is not configured`,
			);
		});
	});
});
