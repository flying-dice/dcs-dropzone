import type { Linker } from "@packages/linker";
import type { JobRecordRepository } from "@packages/queue";
import { getLogger } from "log4js";
import type { Result } from "neverthrow";
import type { DownloadProcessor } from "./ports/DownloadProcessor.ts";
import type { ExtractProcessor } from "./ports/ExtractProcessor.ts";
import type { FileSystem } from "./ports/FileSystem.ts";
import type { KeyValueRepository } from "./ports/KeyValueRepository.ts";
import type { ReleaseRepository } from "./ports/ReleaseRepository.ts";
import type { UUIDGenerator } from "./ports/UUIDGenerator.ts";
import type { ModAndReleaseData } from "./schemas/ModAndReleaseData.ts";
import { MissionScriptingFilesManager } from "./services/MissionScriptingFilesManager.ts";
import { type DcsPathNotConfigured, type DropzoneModsDirNotConfigured, PathResolver } from "./services/PathResolver.ts";
import { ReleaseAssetManager } from "./services/ReleaseAssetManager.ts";
import { ReleaseCatalog } from "./services/ReleaseCatalog.ts";
import { type ReleaseNotFound, ReleaseToggle, type ReleaseToggleError } from "./services/ReleaseToggle.ts";
import { RemoveSymlinksScriptManager } from "./services/RemoveSymlinksScriptManager.ts";
import { Settings } from "./services/Settings.ts";

const logger = getLogger("Application");

type Deps = {
	downloadProcessor: DownloadProcessor;
	extractProcessor: ExtractProcessor;

	keyValueRepository: KeyValueRepository;
	releaseRepository: ReleaseRepository;
	jobRecordRepository: JobRecordRepository;

	generateUuid: UUIDGenerator;
	fileSystem: FileSystem;
	linker: Linker;
};

export abstract class Application {
	private static readonly DAEMON_INSTANCE_ID_KEY = "daemon_instance_id";

	private readonly daemonInstanceId: string;
	private readonly releaseToggleService: ReleaseToggle;
	private readonly releaseCatalog: ReleaseCatalog;
	private readonly releaseAssetManager: ReleaseAssetManager;

	public readonly settings: Settings;

	protected constructor(public readonly deps: Deps) {
		this.daemonInstanceId =
			this.deps.keyValueRepository.get(Application.DAEMON_INSTANCE_ID_KEY) ??
			this.deps.keyValueRepository.save(Application.DAEMON_INSTANCE_ID_KEY, this.deps.generateUuid());

		this.settings = new Settings({
			keyValueRepository: this.deps.keyValueRepository,
			fileSystem: this.deps.fileSystem,
		});

		const pathResolver = new PathResolver({
			...deps,
			getDropzoneModsFolder: () => this.settings.getDropzoneModsDir(),
			getDcsPathForSymbolicLinkDestRoot: (root) => this.settings.getDcsPathForSymbolicLinkDestRoot(root),
		});

		const missionScriptingFilesManager = new MissionScriptingFilesManager({
			...this.deps,
			pathResolver,
		});

		const removeSymlinksScriptManager = new RemoveSymlinksScriptManager({
			...this.deps,
			pathResolver,
			getDropzoneModsFolder: () => this.settings.getDropzoneModsDir(),
		});

		this.releaseAssetManager = new ReleaseAssetManager({
			...this.deps,
			pathResolver,
		});

		this.releaseToggleService = new ReleaseToggle({
			...this.deps,
			releaseAssetManager: this.releaseAssetManager,
			pathResolver,
			missionScriptingFilesManager,
			removeSymlinksScriptManager,
		});

		this.releaseCatalog = new ReleaseCatalog({
			...this.deps,
			releaseAssetManager: this.releaseAssetManager,
			pathResolver,
		});
	}

	public close() {
		this.releaseAssetManager.stopProcessingJobs();
	}

	public getDaemonInstanceId(): string {
		return this.daemonInstanceId;
	}

	public async enableRelease(releaseId: string): Promise<Result<void, ReleaseToggleError>> {
		return this.releaseToggleService.enable(releaseId);
	}

	public disableRelease(releaseId: string): Result<void, ReleaseNotFound | DcsPathNotConfigured> {
		return this.releaseToggleService.disable(releaseId);
	}

	public async toggleRelease(releaseId: string): Promise<Result<void, ReleaseToggleError>> {
		const release = this.deps.releaseRepository.getById(releaseId);
		if (release?.enabled) {
			return this.releaseToggleService.disable(releaseId);
		}
		return this.releaseToggleService.enable(releaseId);
	}

	public addRelease(data: ModAndReleaseData): Result<void, DropzoneModsDirNotConfigured> {
		return this.releaseCatalog.add(data);
	}

	public removeRelease(releaseId: string): void {
		// Try to disable the release first (removes symlinks, rebuilds scripts).
		// Path configuration errors are non-fatal during removal since there are no
		// symlinks or generated files to clean up if paths were never configured.
		const disableResult = this.releaseToggleService.disable(releaseId);
		if (disableResult.isErr()) {
			logger.warn(
				`Could not fully disable release ${releaseId} during removal (${disableResult.error.type}), proceeding with cleanup`,
			);
		}
		this.releaseCatalog.remove(releaseId);
	}

	public getAllReleasesWithStatus() {
		return this.releaseCatalog.getAllReleasesWithStatus();
	}
}
