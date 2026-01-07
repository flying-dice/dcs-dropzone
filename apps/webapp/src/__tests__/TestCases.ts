import { noop } from "lodash";
import { getLogger } from "log4js";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import type { Application } from "../application/Application.ts";
import { ProdApplication } from "../ProdApplication.ts";
import { TestApplication } from "./TestApplication.ts";

const logger = getLogger("TestCases");

logger.debug("Starting in-memory MongoDB server for tests");
const mongoMemoryServer = await MongoMemoryServer.create();

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
			await app.init();

			const cleanup = async () => {
				logger.info("Cleaning up ProdApplication test case database");
				for (const collection of (await mongoose.connection.db?.collections()) ?? []) {
					logger.debug(`Dropping collection: ${collection.collectionName}`);
					await mongoose.connection.db?.dropCollection(collection.collectionName);
				}
			};

			return { app, cleanup };
		},
	},
];
