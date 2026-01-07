import { randomUUID } from "node:crypto";
import { getLogger } from "log4js";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { GithubAuthenticationProvider } from "./adapters/GithubAuthenticationProvider.ts";
import { MongoDownloadsRepository } from "./adapters/MongoDownloadsRepository.ts";
import { MongoModRepository } from "./adapters/MongoModRepository.ts";
import { MongoUserRepository } from "./adapters/MongoUserRepository.ts";
import { Application } from "./application/Application.ts";
import { applyDatabaseMigrations } from "./database";
import { MongoUrl } from "./database/MongoUrl.ts";

const logger = getLogger("ProdApplication");

type Deps = {
	mongoUri: string;
	githubClientId: string;
	githubClientSecret: string;
	githubRedirectUrl: string;
};

export class ProdApplication extends Application {
	private readonly mongoUri: string;

	constructor(deps: Deps) {
		logger.info("Bootstrapping ProdApplication with config:", deps);

		super({
			authProvider: new GithubAuthenticationProvider({
				clientId: deps.githubClientId,
				clientSecret: deps.githubClientSecret,
				redirectUrl: deps.githubRedirectUrl,
			}),
			downloadsRepository: new MongoDownloadsRepository(),
			modRepository: new MongoModRepository(),
			userRepository: new MongoUserRepository(),
			generateUuid: () => randomUUID(),
		});

		this.mongoUri = deps.mongoUri;
	}

	async init(): Promise<void> {
		const mongoUrl = new MongoUrl(this.mongoUri);

		if (mongoUrl.isMemoryDatabase()) {
			logger.info(mongoUrl.toObject(), "Starting in-memory MongoDB build...");

			const mongod = await MongoMemoryServer.create({
				instance: {
					port: mongoUrl.port,
					dbName: mongoUrl.dbName,
				},
			});

			const mongoUri = mongod.getUri(mongoUrl.dbName);
			logger.info(`In-memory MongoDB server started at ${mongoUri}`);
			await mongoose.connect(mongoUri);
		} else {
			logger.info("Connecting to MongoDB...");
			await mongoose.connect(mongoUrl.uri);
		}

		await applyDatabaseMigrations();
	}
}
