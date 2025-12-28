import { beforeEach, describe, expect, it, mock } from "bun:test";
import { DisableRelease } from "./DisableRelease";

describe("DisableRelease", () => {
	let mockRegenerateMissionScriptingFiles: any;
	let mockSetInstalledPathForLinkId: any;
	let mockGetSymbolicLinksForReleaseId: any;
	let mockRemoveDir: any;
	let disableRelease: DisableRelease;

	beforeEach(() => {
		mockRegenerateMissionScriptingFiles = { execute: mock() };
		mockSetInstalledPathForLinkId = { execute: mock() };
		mockGetSymbolicLinksForReleaseId = { execute: mock() };
		mockRemoveDir = { execute: mock() };

		disableRelease = new DisableRelease({
			regenerateMissionScriptingFiles: mockRegenerateMissionScriptingFiles,
			setInstalledPathForLinkId: mockSetInstalledPathForLinkId,
			getSymbolicLinksForReleaseId: mockGetSymbolicLinksForReleaseId,
			removeDir: mockRemoveDir,
		});
	});

	it("removes all symbolic links and updates paths for a valid releaseId", () => {
		const releaseId = "valid-release-id";
		const links = [
			{ id: "link1", installedPath: "/path/to/link1" },
			{ id: "link2", installedPath: "/path/to/link2" },
		];
		mockGetSymbolicLinksForReleaseId.execute.mockReturnValue(links);

		disableRelease.execute(releaseId);

		expect(mockRemoveDir.execute).toHaveBeenCalledWith("/path/to/link1");
		expect(mockRemoveDir.execute).toHaveBeenCalledWith("/path/to/link2");
		expect(mockSetInstalledPathForLinkId.execute).toHaveBeenCalledWith("link1", null);
		expect(mockSetInstalledPathForLinkId.execute).toHaveBeenCalledWith("link2", null);
		expect(mockRegenerateMissionScriptingFiles.execute).toHaveBeenCalled();
	});

	it("handles links with null installedPath gracefully", () => {
		const releaseId = "valid-release-id";
		const links = [
			{ id: "link1", installedPath: null },
			{ id: "link2", installedPath: "/path/to/link2" },
		];
		mockGetSymbolicLinksForReleaseId.execute.mockReturnValue(links);

		disableRelease.execute(releaseId);

		expect(mockRemoveDir.execute).toHaveBeenCalledWith("/path/to/link2");
		expect(mockSetInstalledPathForLinkId.execute).toHaveBeenCalledWith("link2", null);
		expect(mockSetInstalledPathForLinkId.execute).not.toHaveBeenCalledWith("link1", null);
		expect(mockRegenerateMissionScriptingFiles.execute).toHaveBeenCalled();
	});

	it("logs an error and continues if removeDir throws an exception", () => {
		const releaseId = "valid-release-id";
		const links = [
			{ id: "link1", installedPath: "/path/to/link1" },
			{ id: "link2", installedPath: "/path/to/link2" },
		];
		mockGetSymbolicLinksForReleaseId.execute.mockReturnValue(links);
		mockRemoveDir.execute.mockImplementation((path: string) => {
			if (path === "/path/to/link1") throw new Error("Failed to remove directory");

			return;
		});

		disableRelease.execute(releaseId);

		expect(mockRemoveDir.execute).toHaveBeenCalledWith("/path/to/link1");
		expect(mockRemoveDir.execute).toHaveBeenCalledWith("/path/to/link2");
		expect(mockSetInstalledPathForLinkId.execute).toHaveBeenCalledWith("link2", null);
		expect(mockSetInstalledPathForLinkId.execute).not.toHaveBeenCalledWith("link1", null);
		expect(mockRegenerateMissionScriptingFiles.execute).toHaveBeenCalled();
	});
});
