import { describe, expect, it } from "bun:test";
import { faker } from "@faker-js/faker";
import { Application } from "./Application.ts";
import { TestAttributesRepository } from "./repository/impl/TestAttributesRepository.ts";
import { TestReleaseRepository } from "./repository/impl/TestReleaseRepository.ts";
import { TestDownloadQueue } from "./services/impl/TestDownloadQueue.ts";
import { TestExtractQueue } from "./services/impl/TestExtractQueue.ts";
import { TestFileSystem } from "./services/impl/TestFileSystem.ts";
import { TestUUIDGenerator } from "./services/impl/TestUUIDGenerator.ts";

function createTestContext() {
	const attributesRepository = new TestAttributesRepository();
	const generateUuid = TestUUIDGenerator();
	const fileSystem = new TestFileSystem();
	const releaseRepository = new TestReleaseRepository();
	const downloadQueue = new TestDownloadQueue();
	const extractQueue = new TestExtractQueue();
	const dropzoneModsFolder = faker.system.filePath();
	const dcsInstallDir = faker.system.filePath();
	const dcsWorkingDir = faker.system.filePath();

	return {
		attributesRepository,
		generateUuid,
		fileSystem,
		releaseRepository,
		downloadQueue,
		extractQueue,
		dropzoneModsFolder,
		dcsInstallDir,
		dcsWorkingDir,
		build: () =>
			new Application({
				downloadQueue,
				extractQueue,
				attributesRepository,
				releaseRepository,
				generateUuid,
				fileSystem,
				dropzoneModsFolder,
				dcsInstallDir,
				dcsWorkingDir,
			}),
	};
}

describe("Application", () => {
	it("creates application and initializes daemon instance ID from existing ID", () => {
		const existingInstanceId = faker.string.uuid();
		const c = createTestContext();
		c.attributesRepository.getDaemonInstanceId.mockReturnValue(existingInstanceId);
		c.releaseRepository.getAllReleases.mockReturnValue([]);
		const application = c.build();

		expect(application.daemonInstanceId).toEqual(existingInstanceId);
		expect(c.generateUuid).not.toHaveBeenCalled();
	});

	it("creates application and generates new daemon instance ID when none exists", () => {
		const c = createTestContext();
		c.releaseRepository.getAllReleases.mockReturnValue([]);

		const newInstanceId = faker.string.uuid();

		c.generateUuid.mockReturnValue(newInstanceId);
		c.attributesRepository.saveDaemonInstanceId.mockImplementation((it) => it);

		const application = c.build();

		expect(c.generateUuid).toHaveBeenCalled();
		expect(application.daemonInstanceId).toBeDefined();
		expect(application.daemonInstanceId).toEqual(newInstanceId);
	});
});
