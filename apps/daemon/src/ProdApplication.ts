import { getLogger } from "log4js";
import type { SymbolicLinkDestRoot } from "webapp";
import { DrizzleAttributesRepository } from "./adapters/DrizzleAttributesRepository.ts";
import { DrizzleJobRecordRepository } from "./adapters/DrizzleJobRecordRepository.ts";
import { DrizzleReleaseRepository } from "./adapters/DrizzleReleaseRepository.ts";
import { LocalFileSystem } from "./adapters/LocalFileSystem.ts";
import { SevenZipExtractProcessor } from "./adapters/SevenZipExtractProcessor.ts";
import { WgetDownloadProcessor } from "./adapters/WgetDownloadProcessor.ts";
import { Application } from "./application/Application.ts";
import Database from "./database";
import type { AppDatabase } from "./database/app-database.ts";

const logger = getLogger("ProdApplication");

type Deps = {
	databaseUrl: string;
	wgetExecutablePath: string;
	sevenZipExecutablePath: string;
	dropzoneModsFolder: string;
	dcsPaths: Record<SymbolicLinkDestRoot, string>;
};

export class ProdApplication extends Application {
	private readonly appDatabase: AppDatabase;

	constructor(deps: Deps) {
		logger.info("Bootstrapping ProdApplication with config:", deps);
		const { db, appDatabase } = Database(deps.databaseUrl);

		const attributesRepository = new DrizzleAttributesRepository({ db });
		const releaseRepository = new DrizzleReleaseRepository({ db });
		const jobRecordRepository = new DrizzleJobRecordRepository({ db });

		const fileSystem = new LocalFileSystem();

		const downloadProcessor = new WgetDownloadProcessor({ wgetExecutablePath: deps.wgetExecutablePath });
		const extractProcessor = new SevenZipExtractProcessor({
			sevenZipExecutablePath: deps.sevenZipExecutablePath,
		});

		super({
			dcsPaths: deps.dcsPaths,
			dropzoneModsFolder: deps.dropzoneModsFolder,
			generateUuid: () => crypto.randomUUID(),
			attributesRepository,
			releaseRepository,
			fileSystem,
			jobRecordRepository,
			downloadProcessor,
			extractProcessor,
		});

		this.appDatabase = appDatabase;
	}

	override close() {
		super.close();
		this.appDatabase.close();
	}
}
