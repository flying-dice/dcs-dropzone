import { InMemoryJobRecordRepository } from "@packages/queue";
import { Application } from "../application/Application.ts";
import type { DownloadJobData, DownloadJobResult } from "../application/ports/DownloadProcessor.ts";
import type { ExtractJobData, ExtractJobResult } from "../application/ports/ExtractProcessor.ts";
import { TestDelayProcessor } from "./TestDelayProcessor.ts";
import { TestFileSystem } from "./TestFileSystem.ts";
import { TestKeyValueRepository } from "./TestKeyValueRepository.ts";
import { TestReleaseRepository } from "./TestReleaseRepository.ts";
import { TestTempDir } from "./TestTempDir.ts";
import { TestUUIDGenerator } from "./TestUUIDGenerator.ts";

export class TestApplication extends Application {
	constructor() {
		const fileSystem = new TestFileSystem();
		const generateUuid = TestUUIDGenerator();

		const keyValueRepository = new TestKeyValueRepository();
		const releaseRepository = new TestReleaseRepository();
		const jobRecordRepository = new InMemoryJobRecordRepository();

		const downloadProcessor = new TestDelayProcessor<"download", DownloadJobData, DownloadJobResult>("download");
		const extractProcessor = new TestDelayProcessor<"extract", ExtractJobData, ExtractJobResult>("extract");

		const tempFile = new TestTempDir();

		keyValueRepository.save("dropzone_mods_dir", tempFile.join("mods"));
		keyValueRepository.save("dcs_working_dir", tempFile.join("Saved Games", "DCS"));
		keyValueRepository.save("dcs_install_dir", tempFile.join("Program Files", "Eagle Dynamics", "DCS World"));

		super({
			jobRecordRepository,
			downloadProcessor,
			extractProcessor,
			keyValueRepository,
			releaseRepository,
			fileSystem,
			generateUuid,
		});
	}
}
