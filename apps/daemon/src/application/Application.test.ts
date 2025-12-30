import { describe, expect, it } from "bun:test";
import { Application } from "./Application.ts";
import { TestAttributesRepository } from "./repository/impl/TestAttributesRepository.ts";
import { TestReleaseRepository } from "./repository/impl/TestReleaseRepository.ts";
import { TestDownloadQueue } from "./services/impl/TestDownloadQueue.ts";
import { TestExtractQueue } from "./services/impl/TestExtractQueue.ts";
import { TestFileSystem } from "./services/impl/TestFileSystem.ts";
import { TestUUIDGenerator } from "./services/impl/TestUUIDGenerator.ts";

describe("Application", () => {
	it("creates application and initializes daemon instance ID from existing ID", () => {
		const attributesRepository = new TestAttributesRepository();
		attributesRepository.saveDaemonInstanceId("existing-id-123");

		const generateUuid = TestUUIDGenerator();
		const fileSystem = new TestFileSystem();
		const releaseRepository = new TestReleaseRepository();
		const downloadQueue = new TestDownloadQueue();
		const extractQueue = new TestExtractQueue();

		const app = new Application({
			downloadQueue,
			extractQueue,
			attributesRepository,
			releaseRepository,
			generateUuid,
			fileSystem,
			dropzoneModsFolder: "/mods",
			dcsInstallDir: "/dcs/install",
			dcsWorkingDir: "/dcs/working",
		});

		expect(app.daemonInstanceId).toBe("existing-id-123");
	});

	it("creates application and generates new daemon instance ID when none exists", () => {
		const attributesRepository = new TestAttributesRepository();
		const generateUuid = TestUUIDGenerator();
		generateUuid.mockReturnValue("generated-uuid-456");
		const fileSystem = new TestFileSystem();
		const releaseRepository = new TestReleaseRepository();
		const downloadQueue = new TestDownloadQueue();
		const extractQueue = new TestExtractQueue();

		const app = new Application({
			downloadQueue,
			extractQueue,
			attributesRepository,
			releaseRepository,
			generateUuid,
			fileSystem,
			dropzoneModsFolder: "/mods",
			dcsInstallDir: "/dcs/install",
			dcsWorkingDir: "/dcs/working",
		});

		expect(app.daemonInstanceId).toBe("generated-uuid-456");
		expect(attributesRepository.getDaemonInstanceId()).toBe("generated-uuid-456");
	});
});
