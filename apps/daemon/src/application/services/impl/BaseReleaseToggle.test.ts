import { describe, expect, it } from "bun:test";
import { faker } from "@faker-js/faker";
import { zocker } from "zocker";
import { DownloadJobStatus } from "../../enums/DownloadJobStatus.ts";
import { ExtractJobStatus } from "../../enums/ExtractJobStatus.ts";
import { TestReleaseRepository } from "../../repository/impl/TestReleaseRepository.ts";
import { DownloadJob } from "../../schemas/DownloadJob.ts";
import { ExtractJob } from "../../schemas/ExtractJob.ts";
import { SymbolicLink } from "../../schemas/SymbolicLink.ts";
import { BaseReleaseToggle } from "./BaseReleaseToggle.ts";
import { TestDownloadQueue } from "./TestDownloadQueue.ts";
import { TestExtractQueue } from "./TestExtractQueue.ts";
import { TestFileSystem } from "./TestFileSystem.ts";
import { TestMissionScriptingFilesManager } from "./TestMissionScriptingFilesManager.ts";
import { TestPathResolver } from "./TestPathResolver.ts";

function createTestContext() {
	const pathResolver = new TestPathResolver();
	const downloadQueue = new TestDownloadQueue();
	const extractQueue = new TestExtractQueue();
	const fileSystem = new TestFileSystem();
	const releaseRepository = new TestReleaseRepository();
	const missionScriptingFilesManager = new TestMissionScriptingFilesManager();

	return {
		pathResolver,
		downloadQueue,
		extractQueue,
		fileSystem,
		releaseRepository,
		missionScriptingFilesManager,
		build: () =>
			new BaseReleaseToggle({
				pathResolver,
				downloadQueue,
				extractQueue,
				fileSystem,
				releaseRepository,
				missionScriptingFilesManager,
			}),
	};
}

describe("BaseReleaseToggle", () => {
	describe("enable", () => {
		it("should block enabling if any download jobs are not complete", () => {
			const c = createTestContext();

			const inProgressJob: DownloadJob = zocker(DownloadJob)
				.supply(DownloadJob.shape.status, DownloadJobStatus.IN_PROGRESS)
				.generate();

			c.downloadQueue.getJobsForReleaseId.mockReturnValue([inProgressJob]);

			const releaseId = faker.string.uuid();

			const releaseToggle = c.build();

			expect(() => releaseToggle.enable(releaseId)).toThrowError(
				`Cannot enable release ${releaseId} because not all download jobs are completed.`,
			);

			expect(c.downloadQueue.getJobsForReleaseId).toHaveBeenCalledWith(releaseId);
		});

		it("should block enabling if any extract jobs are not complete", () => {
			const c = createTestContext();

			const completedJob: DownloadJob = zocker(DownloadJob)
				.supply(DownloadJob.shape.status, DownloadJobStatus.COMPLETED)
				.generate();

			c.downloadQueue.getJobsForReleaseId.mockReturnValue([completedJob]);

			const extractJob = zocker(ExtractJob).supply(ExtractJob.shape.status, ExtractJobStatus.IN_PROGRESS).generate();

			c.extractQueue.getJobsForReleaseId.mockReturnValue([extractJob]);

			const releaseId = faker.string.uuid();

			const releaseToggle = c.build();

			expect(() => releaseToggle.enable(releaseId)).toThrowError(
				`Cannot enable release ${releaseId} because not all extract jobs are completed.`,
			);
			expect(c.downloadQueue.getJobsForReleaseId).toHaveBeenCalledWith(releaseId);
			expect(c.extractQueue.getJobsForReleaseId).toHaveBeenCalledWith(releaseId);
		});

		it("should enable release when all jobs are completed", () => {
			const c = createTestContext();

			const completedDownloadJob: DownloadJob = zocker(DownloadJob)
				.supply(DownloadJob.shape.status, DownloadJobStatus.COMPLETED)
				.generate();

			c.downloadQueue.getJobsForReleaseId.mockReturnValue([completedDownloadJob]);

			const completedExtractJob: ExtractJob = zocker(ExtractJob)
				.supply(ExtractJob.shape.status, ExtractJobStatus.COMPLETED)
				.generate();

			c.extractQueue.getJobsForReleaseId.mockReturnValue([completedExtractJob]);

			const releaseId = faker.string.uuid();

			const link: SymbolicLink = zocker(SymbolicLink).generate();
			c.releaseRepository.getSymbolicLinksForRelease.mockReturnValue([link]);

			const symlinkSrc = faker.system.directoryPath();
			c.pathResolver.resolveReleasePath.mockReturnValue(symlinkSrc);
			const symlinkDest = faker.system.directoryPath();

			c.pathResolver.resolveSymbolicLinkPath.mockReturnValue(symlinkDest);

			const releaseToggle = c.build();

			expect(() => releaseToggle.enable(releaseId)).not.toThrow();

			expect(c.fileSystem.ensureSymlink).toHaveBeenCalledWith(symlinkSrc, symlinkDest);
			expect(c.releaseRepository.setInstalledPathForSymbolicLink).toHaveBeenCalledWith(link.id, symlinkDest);

			expect(c.missionScriptingFilesManager.rebuild).toHaveBeenCalled();
		});
	});
});
