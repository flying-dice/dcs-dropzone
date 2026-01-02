import { getLogger } from "log4js";
import type { SymbolicLinkDestRoot } from "webapp";
import { Drizzle7zExtractQueue } from "./adapters/Drizzle7zExtractQueue.ts";
import { DrizzleAttributesRepository } from "./adapters/DrizzleAttributesRepository.ts";
import { DrizzleReleaseRepository } from "./adapters/DrizzleReleaseRepository.ts";
import { DrizzleWgetDownloadQueue } from "./adapters/DrizzleWgetDownloadQueue.ts";
import { LocalFileSystem } from "./adapters/LocalFileSystem.ts";
import { Application } from "./application/Application.ts";
import Database from "./database";

const logger = getLogger("ProdApplication");

type Deps = {
	databaseUrl: string;
	wgetExecutablePath: string;
	sevenzipExecutablePath: string;
	dropzoneModsFolder: string;
	dcsPaths: Record<SymbolicLinkDestRoot, string>;
};

export class ProdApplication extends Application {
	constructor(deps: Deps) {
		logger.info("Bootstrapping ProdApplication with config:", deps);
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
