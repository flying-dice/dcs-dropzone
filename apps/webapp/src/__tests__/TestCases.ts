import { noop } from "lodash";
import { getLogger } from "log4js";
import { MongoMemoryServer } from "mongodb-memory-server";
import type { Application } from "../application/Application.ts";
import { ProdApplication } from "../ProdApplication.ts";
import { TestApplication } from "./TestApplication.ts";

const logger = getLogger("TestCases");

logger.debug("Starting in-memory MongoDB server for tests");
const mongoMemoryServer = await MongoMemoryServer.create();
await mongoMemoryServer.ensureInstance();

logger.debug(`In-memory MongoDB server started at URI: ${mongoMemoryServer.getUri()}`);

export type TestCase = { label: string; build: () => Promise<{ app: Application; cleanup: () => Promise<void> }> };

export const TestCases: TestCase[] = [
	{
		label: "TestApplication",
		build: async () => {
			const app = new TestApplication();

			return { app, cleanup: async () => noop() };
		},
	},
	{
		label: "ProdApplication",
		build: async () => {
			const app = new ProdApplication({
				mongoUri: mongoMemoryServer.getUri(),
			});
			const _mongoose = await app.init();

			const cleanup = async () => {
				logger.info("Cleaning up ProdApplication test case database");
				for (const connection of _mongoose.connections) {
					const db = connection.db;
					if (!db) continue;
					const collections = await db.collections({ timeoutMS: 5000 });
					for (const collection of collections) {
						logger.debug(`Dropping collection: ${collection.collectionName}`);
						await db.dropCollection(collection.collectionName, { timeoutMS: 5000 });
					}
				}
			};

			return { app, cleanup };
		},
	},
];
