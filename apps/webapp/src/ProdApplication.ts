import { randomUUID } from "node:crypto";
import { Log } from "@packages/decorators";
import { getLogger } from "log4js";
import mongoose from "mongoose";
import { MongoDownloadsRepository } from "./adapters/MongoDownloadsRepository.ts";
import { MongoModRepository } from "./adapters/MongoModRepository.ts";
import { MongoUserRepository } from "./adapters/MongoUserRepository.ts";
import { Application } from "./application/Application.ts";
import { applyDatabaseMigrations } from "./database";

const logger = getLogger("ProdApplication");

type Deps = {
	mongoUri: string;
};

export class ProdApplication extends Application {
	private readonly mongoUri: string;

	constructor(deps: Deps) {
		logger.info("Bootstrapping ProdApplication...");

		super({
			downloadsRepository: new MongoDownloadsRepository(),
			modRepository: new MongoModRepository(),
			userRepository: new MongoUserRepository(),
			generateUuid: () => randomUUID(),
		});

		this.mongoUri = deps.mongoUri;
	}

	@Log(logger)
	async init(): Promise<void> {
		logger.info("Connecting to MongoDB...");
		await mongoose.connect(this.mongoUri);
		await applyDatabaseMigrations();
	}
}
