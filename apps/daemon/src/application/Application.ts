import AllDaemonReleases from "./observables/AllDaemonReleases.ts";
import type { AttributesRepository } from "./repository/AttributesRepository.ts";
import type { ReleaseRepository } from "./repository/ReleaseRepository.ts";
import type { DownloadQueue } from "./services/DownloadQueue.ts";
import type { ExtractQueue } from "./services/ExtractQueue.ts";
import type { FileSystem } from "./services/FileSystem.ts";
import { BaseMissionScriptingFilesManager } from "./services/impl/BaseMissionScriptingFilesManager.ts";
import { BasePathResolver } from "./services/impl/BasePathResolver.ts";
import { BaseReleaseCatalog } from "./services/impl/BaseReleaseCatalog.ts";
import { BaseReleaseToggle } from "./services/impl/BaseReleaseToggle.ts";
import type { ReleaseCatalog } from "./services/ReleaseCatalog.ts";
import type { ReleaseToggle } from "./services/ReleaseToggle.ts";
import type { UUIDGenerator } from "./services/UUIDGenerator.ts";

type Deps = {
	downloadQueue: DownloadQueue;
	extractQueue: ExtractQueue;

	attributesRepository: AttributesRepository;
	releaseRepository: ReleaseRepository;

	generateUuid: UUIDGenerator;
	fileSystem: FileSystem;

	dropzoneModsFolder: string;
	dcsInstallDir: string;
	dcsWorkingDir: string;
};

export class Application {
	public readonly releaseToggleService: ReleaseToggle;
	public readonly releaseCatalog: ReleaseCatalog;
	public readonly daemonInstanceId: string;

	constructor(protected deps: Deps) {
		this.daemonInstanceId =
			this.deps.attributesRepository.getDaemonInstanceId() ??
			this.deps.attributesRepository.saveDaemonInstanceId(this.deps.generateUuid());

		const pathResolver = new BasePathResolver({ ...deps });

		const missionScriptingFilesManager = new BaseMissionScriptingFilesManager({
			...this.deps,
			pathResolver,
		});

		this.releaseToggleService = new BaseReleaseToggle({
			...this.deps,
			pathResolver,
			missionScriptingFilesManager,
		});

		this.releaseCatalog = new BaseReleaseCatalog({
			...this.deps,
			pathResolver,
			releaseToggleService: this.releaseToggleService,
		});

		AllDaemonReleases.$.next(this.releaseCatalog.getAllReleasesWithStatus());
		setInterval(() => AllDaemonReleases.$.next(this.releaseCatalog.getAllReleasesWithStatus()), 1000);
	}
}
