import { describe, expect, it } from "bun:test";
import {
	TestAttributesRepository,
	TestDownloadQueue,
	TestExtractQueue,
	TestFileSystem,
	TestReleaseRepository,
} from "./__tests__/doubles/index.ts";
import { Application } from "./Application.ts";
import type { UUIDGenerator } from "./services/UUIDGenerator.ts";

describe("Application", () => {
	it("creates application and initializes daemon instance ID from existing ID", () => {
		const attributesRepository = new TestAttributesRepository();
		attributesRepository.saveDaemonInstanceId("existing-id-123");

		const generateUuid: UUIDGenerator = () => "new-uuid";
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
		const generateUuid: UUIDGenerator = () => "generated-uuid-456";
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

	it("initializes releaseToggleService and releaseCatalog", () => {
		const attributesRepository = new TestAttributesRepository();
		attributesRepository.saveDaemonInstanceId("test-id");

		const fileSystem = new TestFileSystem();
		const releaseRepository = new TestReleaseRepository();
		const downloadQueue = new TestDownloadQueue();
		const extractQueue = new TestExtractQueue();

		const app = new Application({
			downloadQueue,
			extractQueue,
			attributesRepository,
			releaseRepository,
			generateUuid: () => "uuid",
			fileSystem,
			dropzoneModsFolder: "/mods",
			dcsInstallDir: "/dcs/install",
			dcsWorkingDir: "/dcs/working",
		});

		expect(app.releaseToggleService).toBeDefined();
		expect(app.releaseCatalog).toBeDefined();
	});

	it("creates distinct instances for each dependency", () => {
		const attributesRepository = new TestAttributesRepository();
		attributesRepository.saveDaemonInstanceId("test-id");

		const fileSystem = new TestFileSystem();
		const releaseRepository = new TestReleaseRepository();
		const downloadQueue = new TestDownloadQueue();
		const extractQueue = new TestExtractQueue();

		const app1 = new Application({
			downloadQueue,
			extractQueue,
			attributesRepository,
			releaseRepository,
			generateUuid: () => "uuid-1",
			fileSystem,
			dropzoneModsFolder: "/mods1",
			dcsInstallDir: "/dcs/install1",
			dcsWorkingDir: "/dcs/working1",
		});

		const app2 = new Application({
			downloadQueue,
			extractQueue,
			attributesRepository,
			releaseRepository,
			generateUuid: () => "uuid-2",
			fileSystem,
			dropzoneModsFolder: "/mods2",
			dcsInstallDir: "/dcs/install2",
			dcsWorkingDir: "/dcs/working2",
		});

		// Each application instance should have its own service instances
		expect(app1.releaseToggleService).not.toBe(app2.releaseToggleService);
		expect(app1.releaseCatalog).not.toBe(app2.releaseCatalog);
	});
});
