import type { SymbolicLinkDestRoot } from "webapp";
import { Drizzle7zExtractQueue } from "./adapters/Drizzle7zExtractQueue.ts";
import { DrizzleAttributesRepository } from "./adapters/DrizzleAttributesRepository.ts";
import { DrizzleReleaseRepository } from "./adapters/DrizzleReleaseRepository.ts";
import { DrizzleWgetDownloadQueue } from "./adapters/DrizzleWgetDownloadQueue.ts";
import { LocalFileSystem } from "./adapters/LocalFileSystem.ts";
import { BaseApplication } from "./application/BaseApplication.ts";
import Database from "./database";

type Deps = {
	databaseUrl: string;
	wgetExecutablePath: string;
	sevenzipExecutablePath: string;
	dropzoneModsFolder: string;
	dcsPaths: Record<SymbolicLinkDestRoot, string>;
};

export class Application extends BaseApplication {
	constructor(deps: Deps) {
		const db = Database(deps.databaseUrl);
		const attributesRepository = new DrizzleAttributesRepository({ db });
		const releaseRepository = new DrizzleReleaseRepository({ db });

		const downloadQueue = new DrizzleWgetDownloadQueue({
			db,
			wgetExecutablePath: deps.wgetExecutablePath,
		});

		const extractQueue = new Drizzle7zExtractQueue({
			db,
			downloadQueue,
			sevenzipExecutablePath: deps.sevenzipExecutablePath,
		});

		const fileSystem = new LocalFileSystem();

		super({
			dcsPaths: deps.dcsPaths,
			dropzoneModsFolder: deps.dropzoneModsFolder,
			generateUuid: () => crypto.randomUUID(),
			attributesRepository,
			releaseRepository,
			downloadQueue,
			extractQueue,
			fileSystem,
		});
	}
}
