import { describe, expect, it } from "bun:test";
import { Application } from "./Application.ts";
import type { AttributesRepository } from "./repository/AttributesRepository.ts";
import type { ReleaseRepository } from "./repository/ReleaseRepository.ts";
import type { DownloadQueue } from "./services/DownloadQueue.ts";
import type { ExtractQueue } from "./services/ExtractQueue.ts";
import type { FileSystem } from "./services/FileSystem.ts";
import type { UUIDGenerator } from "./services/UUIDGenerator.ts";

describe("Application", () => {
	it("creates application and initializes daemon instance ID from existing ID", () => {
		const mockAttributesRepository: AttributesRepository = {
			getDaemonInstanceId: () => "existing-id-123",
			saveDaemonInstanceId: () => "existing-id-123",
		};

		const mockGenerateUuid: UUIDGenerator = () => "new-uuid";

		const mockFileSystem: FileSystem = {
			resolve: (...paths: string[]) => paths.join("/"),
			writeFile: () => {},
			ensureDir: () => {},
			removeDir: () => {},
			ensureSymlink: () => {},
		};

		const mockReleaseRepository: ReleaseRepository = {
			getAllReleases: () => [],
			getReleaseAssetsForRelease: () => [],
			getSymbolicLinksForRelease: () => [],
			getMissionScriptsForRelease: () => [],
			saveRelease: () => {},
			deleteRelease: () => {},
			setInstalledPathForSymbolicLink: () => {},
			getMissionScriptsByRunOn: () => [],
		};

		const mockDownloadQueue: DownloadQueue = {
			getJobsForReleaseAssetId: () => [],
			getJobsForReleaseId: () => [],
			pushJob: () => {},
			cancelJobsForRelease: () => {},
		} as any;

		const mockExtractQueue: ExtractQueue = {
			getJobsForReleaseAssetId: () => [],
			getJobsForReleaseId: () => [],
			pushJob: () => {},
			cancelJobsForRelease: () => {},
		} as any;

		const app = new Application({
			downloadQueue: mockDownloadQueue,
			extractQueue: mockExtractQueue,
			attributesRepository: mockAttributesRepository,
			releaseRepository: mockReleaseRepository,
			generateUuid: mockGenerateUuid,
			fileSystem: mockFileSystem,
			dropzoneModsFolder: "/mods",
			dcsInstallDir: "/dcs/install",
			dcsWorkingDir: "/dcs/working",
		});

		expect(app.daemonInstanceId).toBe("existing-id-123");
	});

	it("creates application and generates new daemon instance ID when none exists", () => {
		let savedId: string | undefined;

		const mockAttributesRepository: AttributesRepository = {
			getDaemonInstanceId: () => undefined,
			saveDaemonInstanceId: (id: string) => {
				savedId = id;
				return id;
			},
		};

		const mockGenerateUuid: UUIDGenerator = () => "generated-uuid-456";

		const mockFileSystem: FileSystem = {
			resolve: (...paths: string[]) => paths.join("/"),
			writeFile: () => {},
			ensureDir: () => {},
			removeDir: () => {},
			ensureSymlink: () => {},
		};

		const mockReleaseRepository: ReleaseRepository = {
			getAllReleases: () => [],
			getReleaseAssetsForRelease: () => [],
			getSymbolicLinksForRelease: () => [],
			getMissionScriptsForRelease: () => [],
			saveRelease: () => {},
			deleteRelease: () => {},
			setInstalledPathForSymbolicLink: () => {},
			getMissionScriptsByRunOn: () => [],
		};

		const mockDownloadQueue: DownloadQueue = {
			getJobsForReleaseAssetId: () => [],
			getJobsForReleaseId: () => [],
			pushJob: () => {},
			cancelJobsForRelease: () => {},
		} as any;

		const mockExtractQueue: ExtractQueue = {
			getJobsForReleaseAssetId: () => [],
			getJobsForReleaseId: () => [],
			pushJob: () => {},
			cancelJobsForRelease: () => {},
		} as any;

		const app = new Application({
			downloadQueue: mockDownloadQueue,
			extractQueue: mockExtractQueue,
			attributesRepository: mockAttributesRepository,
			releaseRepository: mockReleaseRepository,
			generateUuid: mockGenerateUuid,
			fileSystem: mockFileSystem,
			dropzoneModsFolder: "/mods",
			dcsInstallDir: "/dcs/install",
			dcsWorkingDir: "/dcs/working",
		});

		expect(app.daemonInstanceId).toBe("generated-uuid-456");
		expect(savedId).toBe("generated-uuid-456");
	});

	it("initializes releaseToggleService and releaseCatalog", () => {
		const mockAttributesRepository: AttributesRepository = {
			getDaemonInstanceId: () => "test-id",
			saveDaemonInstanceId: () => "test-id",
		};

		const mockFileSystem: FileSystem = {
			resolve: (...paths: string[]) => paths.join("/"),
			writeFile: () => {},
			ensureDir: () => {},
			removeDir: () => {},
			ensureSymlink: () => {},
		};

		const mockReleaseRepository: ReleaseRepository = {
			getAllReleases: () => [],
			getReleaseAssetsForRelease: () => [],
			getSymbolicLinksForRelease: () => [],
			getMissionScriptsForRelease: () => [],
			saveRelease: () => {},
			deleteRelease: () => {},
			setInstalledPathForSymbolicLink: () => {},
			getMissionScriptsByRunOn: () => [],
		};

		const mockDownloadQueue: DownloadQueue = {
			getJobsForReleaseAssetId: () => [],
			getJobsForReleaseId: () => [],
			pushJob: () => {},
			cancelJobsForRelease: () => {},
		} as any;

		const mockExtractQueue: ExtractQueue = {
			getJobsForReleaseAssetId: () => [],
			getJobsForReleaseId: () => [],
			pushJob: () => {},
			cancelJobsForRelease: () => {},
		} as any;

		const app = new Application({
			downloadQueue: mockDownloadQueue,
			extractQueue: mockExtractQueue,
			attributesRepository: mockAttributesRepository,
			releaseRepository: mockReleaseRepository,
			generateUuid: () => "uuid",
			fileSystem: mockFileSystem,
			dropzoneModsFolder: "/mods",
			dcsInstallDir: "/dcs/install",
			dcsWorkingDir: "/dcs/working",
		});

		expect(app.releaseToggleService).toBeDefined();
		expect(app.releaseCatalog).toBeDefined();
	});

	it("creates distinct instances for each dependency", () => {
		const mockAttributesRepository: AttributesRepository = {
			getDaemonInstanceId: () => "test-id",
			saveDaemonInstanceId: () => "test-id",
		};

		const mockFileSystem: FileSystem = {
			resolve: (...paths: string[]) => paths.join("/"),
			writeFile: () => {},
			ensureDir: () => {},
			removeDir: () => {},
			ensureSymlink: () => {},
		};

		const mockReleaseRepository: ReleaseRepository = {
			getAllReleases: () => [],
			getReleaseAssetsForRelease: () => [],
			getSymbolicLinksForRelease: () => [],
			getMissionScriptsForRelease: () => [],
			saveRelease: () => {},
			deleteRelease: () => {},
			setInstalledPathForSymbolicLink: () => {},
			getMissionScriptsByRunOn: () => [],
		};

		const mockDownloadQueue: DownloadQueue = {
			getJobsForReleaseAssetId: () => [],
			getJobsForReleaseId: () => [],
			pushJob: () => {},
			cancelJobsForRelease: () => {},
		} as any;

		const mockExtractQueue: ExtractQueue = {
			getJobsForReleaseAssetId: () => [],
			getJobsForReleaseId: () => [],
			pushJob: () => {},
			cancelJobsForRelease: () => {},
		} as any;

		const app1 = new Application({
			downloadQueue: mockDownloadQueue,
			extractQueue: mockExtractQueue,
			attributesRepository: mockAttributesRepository,
			releaseRepository: mockReleaseRepository,
			generateUuid: () => "uuid-1",
			fileSystem: mockFileSystem,
			dropzoneModsFolder: "/mods1",
			dcsInstallDir: "/dcs/install1",
			dcsWorkingDir: "/dcs/working1",
		});

		const app2 = new Application({
			downloadQueue: mockDownloadQueue,
			extractQueue: mockExtractQueue,
			attributesRepository: mockAttributesRepository,
			releaseRepository: mockReleaseRepository,
			generateUuid: () => "uuid-2",
			fileSystem: mockFileSystem,
			dropzoneModsFolder: "/mods2",
			dcsInstallDir: "/dcs/install2",
			dcsWorkingDir: "/dcs/working2",
		});

		// Each application instance should have its own service instances
		expect(app1.releaseToggleService).not.toBe(app2.releaseToggleService);
		expect(app1.releaseCatalog).not.toBe(app2.releaseCatalog);
	});
});
