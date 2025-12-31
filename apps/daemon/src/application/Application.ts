import { BehaviorSubject, type Observable } from "rxjs";
import type { SymbolicLinkDestRoot } from "webapp";
import type { AttributesRepository } from "./ports/AttributesRepository.ts";
import type { DownloadQueue } from "./ports/DownloadQueue.ts";
import type { ExtractQueue } from "./ports/ExtractQueue.ts";
import type { FileSystem } from "./ports/FileSystem.ts";
import type { ReleaseRepository } from "./ports/ReleaseRepository.ts";
import type { UUIDGenerator } from "./ports/UUIDGenerator.ts";
import type { ModAndReleaseData } from "./schemas/ModAndReleaseData.ts";
import { MissionScriptingFilesManager } from "./services/MissionScriptingFilesManager.ts";
import { PathResolver } from "./services/PathResolver.ts";
import { ReleaseCatalog } from "./services/ReleaseCatalog.ts";
import { ReleaseToggle } from "./services/ReleaseToggle.ts";

type Deps = {
	downloadQueue: DownloadQueue;
	extractQueue: ExtractQueue;

	attributesRepository: AttributesRepository;
	releaseRepository: ReleaseRepository;

	generateUuid: UUIDGenerator;
	fileSystem: FileSystem;

	dropzoneModsFolder: string;
	dcsPaths: Record<SymbolicLinkDestRoot, string>;
};

export class Application {
	private static readonly DAEMON_INSTANCE_ID_KEY = "daemon_instance_id";

	private readonly daemonInstanceId: string;
	private readonly releaseToggleService: ReleaseToggle;
	private readonly releaseCatalog: ReleaseCatalog;

	private _release$ = new BehaviorSubject<ModAndReleaseData[]>([]);

	get release$(): Observable<ModAndReleaseData[]> {
		return this._release$.asObservable();
	}

	constructor(protected deps: Deps) {
		this.daemonInstanceId =
			this.deps.attributesRepository.get(Application.DAEMON_INSTANCE_ID_KEY) ??
			this.deps.attributesRepository.save(Application.DAEMON_INSTANCE_ID_KEY, this.deps.generateUuid());

		const pathResolver = new PathResolver({ ...deps });

		const missionScriptingFilesManager = new MissionScriptingFilesManager({
			...this.deps,
			pathResolver,
		});

		this.releaseToggleService = new ReleaseToggle({
			...this.deps,
			pathResolver,
			missionScriptingFilesManager,
		});

		this.releaseCatalog = new ReleaseCatalog({
			...this.deps,
			pathResolver,
		});

		this.updateReleasesObservable();
		setInterval(() => this.updateReleasesObservable(), 1000);
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
