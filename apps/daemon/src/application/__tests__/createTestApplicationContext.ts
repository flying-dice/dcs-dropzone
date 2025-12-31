import { Application } from "../Application.ts";
import { TestAttributesRepository } from "./TestAttributesRepository.ts";
import { TestDownloadQueue } from "./TestDownloadQueue.ts";
import { TestExtractQueue } from "./TestExtractQueue.ts";
import { TestFileSystem } from "./TestFileSystem.ts";
import { TestReleaseRepository } from "./TestReleaseRepository.ts";
import { TestUUIDGenerator } from "./TestUUIDGenerator.ts";

export function createTestApplicationContext() {
	const downloadQueue = new TestDownloadQueue();
	const extractQueue = new TestExtractQueue();
	const fileSystem = new TestFileSystem();
	const generateUuid = TestUUIDGenerator();

	const attributesRepository = new TestAttributesRepository();
	const releaseRepository = new TestReleaseRepository();

	const dropzoneModsFolder = "mods";
	const dcsWorkingDir = "C:/Users/JohnDoe/Saved Games/DCS";
	const dcsInstallDir = "C:/Program Files/Eagle Dynamics/DCS World";

	return {
		attributesRepository,
		releaseRepository,
		downloadQueue,
		extractQueue,
		fileSystem,
		generateUuid,
		dropzoneModsFolder,
		dcsWorkingDir,
		dcsInstallDir,
		build: () =>
			new Application({
				attributesRepository,
				releaseRepository,
				downloadQueue,
				extractQueue,
				fileSystem,
				generateUuid,
				dropzoneModsFolder,
				dcsPaths: {
					DCS_WORKING_DIR: dcsWorkingDir,
					DCS_INSTALL_DIR: dcsInstallDir,
				},
			}),
	};
}
