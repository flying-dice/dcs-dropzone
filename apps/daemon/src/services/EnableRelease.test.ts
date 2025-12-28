import { beforeEach, describe, expect, it, mock } from "bun:test";
import { EnableRelease } from "./EnableRelease";

describe("EnableRelease", () => {
	let mockRegenerateMissionScriptingFiles: any;
	let mockSetInstalledPathForLinkId: any;
	let mockGetSymbolicLinksForReleaseId: any;
	let mockResolveReleasePath: any;
	let mockResolveSymbolicLinkPath: any;
	let mockEnsureSymlink: any;
	let mockOnCreateSymlink: any;
	let enableRelease: EnableRelease;

	beforeEach(() => {
		mockRegenerateMissionScriptingFiles = { execute: mock() };
		mockSetInstalledPathForLinkId = { execute: mock() };
		mockGetSymbolicLinksForReleaseId = { execute: mock() };
		mockResolveReleasePath = { execute: mock() };
		mockResolveSymbolicLinkPath = { execute: mock() };
		mockEnsureSymlink = { execute: mock() };
		mockOnCreateSymlink = mock();

		enableRelease = new EnableRelease({
			regenerateMissionScriptingFiles: mockRegenerateMissionScriptingFiles,
			setInstalledPathForLinkId: mockSetInstalledPathForLinkId,
			getSymbolicLinksForReleaseId: mockGetSymbolicLinksForReleaseId,
			resolveReleasePath: mockResolveReleasePath,
			resolveSymbolicLinkPath: mockResolveSymbolicLinkPath,
			onCreateSymlink: mockOnCreateSymlink,
			ensureSymlink: mockEnsureSymlink,
		});
	});

	it("creates symlinks and updates paths for all links", () => {
		const releaseId = "valid-release-id";
		const links = [
			{ id: "link1", src: "src1", destRoot: "root1", dest: "dest1" },
			{ id: "link2", src: "src2", destRoot: "root2", dest: "dest2" },
		];
		mockGetSymbolicLinksForReleaseId.execute.mockReturnValue(links);
		mockResolveReleasePath.execute.mockReturnValueOnce("/resolved/src1").mockReturnValueOnce("/resolved/src2");
		mockResolveSymbolicLinkPath.execute.mockReturnValueOnce("/resolved/dest1").mockReturnValueOnce("/resolved/dest2");

		enableRelease.execute(releaseId);

		expect(mockEnsureSymlink.execute).toHaveBeenCalledWith("/resolved/src1", "/resolved/dest1");
		expect(mockEnsureSymlink.execute).toHaveBeenCalledWith("/resolved/src2", "/resolved/dest2");
		expect(mockSetInstalledPathForLinkId.execute).toHaveBeenCalledWith("link1", "/resolved/dest1");
		expect(mockSetInstalledPathForLinkId.execute).toHaveBeenCalledWith("link2", "/resolved/dest2");
		expect(mockOnCreateSymlink).toHaveBeenCalledWith("/resolved/src1", "/resolved/dest1");
		expect(mockOnCreateSymlink).toHaveBeenCalledWith("/resolved/src2", "/resolved/dest2");
		expect(mockRegenerateMissionScriptingFiles.execute).toHaveBeenCalled();
	});

	it("handles empty links array gracefully", () => {
		const releaseId = "valid-release-id";
		mockGetSymbolicLinksForReleaseId.execute.mockReturnValue([]);

		enableRelease.execute(releaseId);

		expect(mockEnsureSymlink.execute).not.toHaveBeenCalled();
		expect(mockSetInstalledPathForLinkId.execute).not.toHaveBeenCalled();
		expect(mockOnCreateSymlink).not.toHaveBeenCalled();
		expect(mockRegenerateMissionScriptingFiles.execute).toHaveBeenCalled();
	});

	it("throws an error if a dependency fails", () => {
		const releaseId = "valid-release-id";
		const links = [{ id: "link1", src: "src1", destRoot: "root1", dest: "dest1" }];
		mockGetSymbolicLinksForReleaseId.execute.mockReturnValue(links);
		mockResolveReleasePath.execute.mockReturnValue("/resolved/src1");
		mockResolveSymbolicLinkPath.execute.mockReturnValue("/resolved/dest1");
		mockEnsureSymlink.execute.mockImplementation(() => {
			throw new Error("Symlink creation failed");
		});

		expect(() => enableRelease.execute(releaseId)).toThrow("Symlink creation failed");

		expect(mockSetInstalledPathForLinkId.execute).not.toHaveBeenCalled();
		expect(mockOnCreateSymlink).not.toHaveBeenCalled();
		expect(mockRegenerateMissionScriptingFiles.execute).not.toHaveBeenCalled();
	});
});
