import { getLogger } from "log4js";
import { DrizzleJobRecordRepository } from "./adapters/DrizzleJobRecordRepository.ts";
import { DrizzleKeyValueRepository } from "./adapters/DrizzleKeyValueRepository.ts";
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
};

export class ProdApplication extends Application {
	private readonly appDatabase: AppDatabase;

	constructor(deps: Deps) {
		logger.info("Bootstrapping ProdApplication with config:", deps);
		const { db, appDatabase } = Database(deps.databaseUrl);

		const keyValueRepository = new DrizzleKeyValueRepository({ db });
		const releaseRepository = new DrizzleReleaseRepository({ db });
		const jobRecordRepository = new DrizzleJobRecordRepository({ db });

		const fileSystem = new LocalFileSystem();

		const downloadProcessor = new WgetDownloadProcessor({ wgetExecutablePath: deps.wgetExecutablePath });
		const extractProcessor = new SevenZipExtractProcessor({
			sevenZipExecutablePath: deps.sevenZipExecutablePath,
		});

		super({
			generateUuid: () => crypto.randomUUID(),
			keyValueRepository,
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
