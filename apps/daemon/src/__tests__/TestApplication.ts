import { InMemoryJobRecordRepository } from "@packages/queue";
import { Application } from "../application/Application.ts";
import type { DownloadJobData, DownloadJobResult } from "../application/ports/DownloadProcessor.ts";
import type { ExtractJobData, ExtractJobResult } from "../application/ports/ExtractProcessor.ts";
import { TestAttributesRepository } from "./TestAttributesRepository.ts";
import { TestDelayProcessor } from "./TestDelayProcessor.ts";
import { TestFileSystem } from "./TestFileSystem.ts";
import { TestReleaseRepository } from "./TestReleaseRepository.ts";
import { TestUUIDGenerator } from "./TestUUIDGenerator.ts";

export class TestApplication extends Application {
	constructor() {
		const fileSystem = new TestFileSystem();
		const generateUuid = TestUUIDGenerator();

		const attributesRepository = new TestAttributesRepository();
		const releaseRepository = new TestReleaseRepository();
		const jobRecordRepository = new InMemoryJobRecordRepository();

		const downloadProcessor = new TestDelayProcessor<"download", DownloadJobData, DownloadJobResult>("download");
		const extractProcessor = new TestDelayProcessor<"extract", ExtractJobData, ExtractJobResult>("extract");

		const dropzoneModsFolder = "mods";
		const dcsWorkingDir = "C:/Users/JohnDoe/Saved Games/DCS";
		const dcsInstallDir = "C:/Program Files/Eagle Dynamics/DCS World";

		super({
			jobRecordRepository,
			downloadProcessor,
			extractProcessor,
			attributesRepository,
			releaseRepository,
			fileSystem,
			generateUuid,
			dropzoneModsFolder,
			dcsPaths: {
				DCS_WORKING_DIR: dcsWorkingDir,
				DCS_INSTALL_DIR: dcsInstallDir,
			},
		});
	}
}
