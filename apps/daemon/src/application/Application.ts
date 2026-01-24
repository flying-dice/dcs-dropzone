import type { JobRecordRepository } from "@packages/queue";
import { BehaviorSubject, type Observable } from "rxjs";
import type { SymbolicLinkDestRoot } from "webapp";
import type { AttributesRepository } from "./ports/AttributesRepository.ts";
import type { DownloadProcessor } from "./ports/DownloadProcessor.ts";
import type { ExtractProcessor } from "./ports/ExtractProcessor.ts";
import type { FileSystem } from "./ports/FileSystem.ts";
import type { ReleaseRepository } from "./ports/ReleaseRepository.ts";
import type { UUIDGenerator } from "./ports/UUIDGenerator.ts";
import type { ModAndReleaseData } from "./schemas/ModAndReleaseData.ts";
import { MissionScriptingFilesManager } from "./services/MissionScriptingFilesManager.ts";
import { PathResolver } from "./services/PathResolver.ts";
import { ReleaseAssetManager } from "./services/ReleaseAssetManager.ts";
import { ReleaseCatalog } from "./services/ReleaseCatalog.ts";
import { ReleaseToggle } from "./services/ReleaseToggle.ts";

type Deps = {
	downloadProcessor: DownloadProcessor;
	extractProcessor: ExtractProcessor;

	attributesRepository: AttributesRepository;
	releaseRepository: ReleaseRepository;
	jobRecordRepository: JobRecordRepository;

	generateUuid: UUIDGenerator;
	fileSystem: FileSystem;

	dropzoneModsFolder: string;
	dcsPaths: Record<SymbolicLinkDestRoot, string>;
};

export abstract class Application {
	private static readonly DAEMON_INSTANCE_ID_KEY = "daemon_instance_id";

	private readonly daemonInstanceId: string;
	private readonly releaseToggleService: ReleaseToggle;
	private readonly releaseCatalog: ReleaseCatalog;
	private readonly releaseAssetManager: ReleaseAssetManager;

	private _release$ = new BehaviorSubject<ModAndReleaseData[]>([]);

	get release$(): Observable<ModAndReleaseData[]> {
		return this._release$.asObservable();
	}

	private readonly updateReleasesTimeout: NodeJS.Timeout;

	protected constructor(public readonly deps: Deps) {
		this.daemonInstanceId =
			this.deps.attributesRepository.get(Application.DAEMON_INSTANCE_ID_KEY) ??
			this.deps.attributesRepository.save(Application.DAEMON_INSTANCE_ID_KEY, this.deps.generateUuid());

		const pathResolver = new PathResolver({ ...deps });

		const missionScriptingFilesManager = new MissionScriptingFilesManager({
			...this.deps,
			pathResolver,
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
		});

		this.releaseCatalog = new ReleaseCatalog({
			...this.deps,
			releaseAssetManager: this.releaseAssetManager,
			pathResolver,
		});

		this.updateReleasesObservable();
		this.updateReleasesTimeout = setInterval(() => this.updateReleasesObservable(), 1000);
	}

	public close() {
		this.releaseAssetManager.stopProcessingJobs();
		this.updateReleasesTimeout.close();
	}

	public getDaemonInstanceId(): string {
		return this.daemonInstanceId;
	}

	public enableRelease(releaseId: string): void {
		this.releaseToggleService.enable(releaseId);
		this.updateReleasesObservable();
	}

	public disableRelease(releaseId: string): void {
		this.releaseToggleService.disable(releaseId);
		this.updateReleasesObservable();
	}

	public addRelease(data: ModAndReleaseData): void {
		this.releaseCatalog.add(data);
		this.updateReleasesObservable();
	}

	public removeRelease(releaseId: string): void {
		this.releaseToggleService.disable(releaseId);
		this.releaseCatalog.remove(releaseId);
		this.updateReleasesObservable();
	}

	public getAllReleasesWithStatus() {
		return this.releaseCatalog.getAllReleasesWithStatus();
	}

	private updateReleasesObservable() {
		this._release$.next(this.releaseCatalog.getAllReleasesWithStatus());
	}
}
