import AllDaemonReleases from "./observables/AllDaemonReleases.ts";
import type { AttributesRepository } from "./repository/AttributesRepository.ts";
import type { ReleaseRepository } from "./repository/ReleaseRepository.ts";
import type { DownloadQueue } from "./services/DownloadQueue.ts";
import type { ExtractQueue } from "./services/ExtractQueue.ts";
import type { FileSystem } from "./services/FileSystem.ts";
import { MissionScriptingFilesManager } from "./services/MissionScriptingFilesManager.ts";
import { PathResolver } from "./services/PathResolver.ts";
import { ReleaseCatalog } from "./services/ReleaseCatalog.ts";
import { ReleaseToggle } from "./services/ReleaseToggle.ts";
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
			releaseToggleService: this.releaseToggleService,
		});

		AllDaemonReleases.$.next(this.releaseCatalog.getAllReleasesWithStatus());
		setInterval(() => AllDaemonReleases.$.next(this.releaseCatalog.getAllReleasesWithStatus()), 1000);
	}
}
