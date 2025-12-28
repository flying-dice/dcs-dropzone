import { beforeEach, describe, expect, it, mock } from "bun:test";
import { RemoveRelease } from "./RemoveRelease";

describe("RemoveRelease", () => {
	let mockDisableRelease: any;
	let mockResolveReleasePath: any;
	let mockDownloadQueue: any;
	let mockExtractQueue: any;
	let mockDeleteModAndReleaseForReleaseId: any;
	let mockRemoveDir: any;
	let removeRelease: RemoveRelease;

	beforeEach(() => {
		mockDisableRelease = { execute: mock() };
		mockResolveReleasePath = { execute: mock() };
		mockDownloadQueue = { cancelJobsForRelease: mock() };
		mockExtractQueue = { cancelJobsForRelease: mock() };
		mockDeleteModAndReleaseForReleaseId = { execute: mock() };
		mockRemoveDir = { execute: mock() };

		removeRelease = new RemoveRelease({
			disableRelease: mockDisableRelease,
			resolveReleasePath: mockResolveReleasePath,
			downloadQueue: mockDownloadQueue,
			extractQueue: mockExtractQueue,
			deleteModAndReleaseForReleaseId: mockDeleteModAndReleaseForReleaseId,
			removeDir: mockRemoveDir,
		});
	});

	it("executes all dependencies for a valid releaseId with correct arguments", () => {
		const releaseId = "valid-release-id";
		const releaseFolder = "/path/to/release";

		mockResolveReleasePath.execute.mockReturnValue(releaseFolder);

		removeRelease.execute(releaseId);

		expect(mockDisableRelease.execute).toHaveBeenCalledWith(releaseId);
		expect(mockDownloadQueue.cancelJobsForRelease).toHaveBeenCalledWith(releaseId);
		expect(mockExtractQueue.cancelJobsForRelease).toHaveBeenCalledWith(releaseId);
		expect(mockResolveReleasePath.execute).toHaveBeenCalledWith(releaseId);
		expect(mockRemoveDir.execute).toHaveBeenCalledWith(releaseFolder);
		expect(mockDeleteModAndReleaseForReleaseId.execute).toHaveBeenCalledWith(releaseId);
	});

	it("accepts an empty releaseId and still invokes all dependent actions", () => {
		const releaseId = "";
		const releaseFolder = "/path/to/release";

		mockResolveReleasePath.execute.mockReturnValue(releaseFolder);

		expect(() => removeRelease.execute(releaseId)).not.toThrow();

		expect(mockDisableRelease.execute).toHaveBeenCalledWith(releaseId);
		expect(mockDownloadQueue.cancelJobsForRelease).toHaveBeenCalledWith(releaseId);
		expect(mockExtractQueue.cancelJobsForRelease).toHaveBeenCalledWith(releaseId);
		expect(mockResolveReleasePath.execute).toHaveBeenCalledWith(releaseId);
		expect(mockRemoveDir.execute).toHaveBeenCalledWith(releaseFolder);
		expect(mockDeleteModAndReleaseForReleaseId.execute).toHaveBeenCalledWith(releaseId);
	});

	it("propagates errors from dependencies and prevents subsequent steps from running", () => {
		const releaseId = "release-with-error";
		mockDisableRelease.execute.mockImplementation(() => {
			throw new Error("DisableRelease failed");
		});

		expect(() => removeRelease.execute(releaseId)).toThrow("DisableRelease failed");

		expect(mockDownloadQueue.cancelJobsForRelease).not.toHaveBeenCalled();
		expect(mockExtractQueue.cancelJobsForRelease).not.toHaveBeenCalled();
		expect(mockResolveReleasePath.execute).not.toHaveBeenCalled();
		expect(mockRemoveDir.execute).not.toHaveBeenCalled();
		expect(mockDeleteModAndReleaseForReleaseId.execute).not.toHaveBeenCalled();
	});
});
