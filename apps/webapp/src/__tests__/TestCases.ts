import { randomUUID } from "node:crypto";
import { getLogger } from "log4js";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Application } from "../application/Application.ts";
import { MongoDownloadsRepository } from "../adapters/MongoDownloadsRepository.ts";
import { MongoModRepository } from "../adapters/MongoModRepository.ts";
import { MongoUserRepository } from "../adapters/MongoUserRepository.ts";
import { applyDatabaseMigrations } from "../database/index.ts";
import { TestApplication } from "./TestApplication.ts";
import { TestAuthenticationProvider } from "./TestAuthenticationProvider.ts";

const logger = getLogger("TestCases");

/**
 * Interface for test applications that support clearing test data.
 */
export interface TestableApplication {
	app: Application;
	clear: () => Promise<void>;
	cleanup: () => Promise<void>;
	testAuthProvider?: TestAuthenticationProvider;
	testModRepository?: {
		setUser: (user: { id: string; username: string }) => void;
		getAllMods: () => unknown[];
		getAllReleases: () => unknown[];
	};
	testUserRepository?: {
		getAllUsers: () => unknown[];
	};
	testDownloadsRepository?: {
		getModReleaseDownloadCount: (modId: string, releaseId: string) => Promise<number>;
	};
}

export type TestCase = {
	label: string;
	build: () => TestableApplication;
};

/**
 * ProdApplication wrapper for testing that handles MongoDB in-memory setup.
 */
class ProdTestApplication extends Application {
	private static mongod: MongoMemoryServer | null = null;
	private static initialized = false;
	private readonly authProvider: TestAuthenticationProvider;

	constructor(authProvider: TestAuthenticationProvider) {
		logger.info("Creating ProdApplication for testing");

		super({
			authProvider,
			downloadsRepository: new MongoDownloadsRepository(),
			modRepository: new MongoModRepository(),
			userRepository: new MongoUserRepository(),
			generateUuid: () => randomUUID(),
		});

		this.authProvider = authProvider;
	}

	getTestAuthProvider(): TestAuthenticationProvider {
		return this.authProvider;
	}

	static async initialize(): Promise<void> {
		if (this.initialized) {
			return;
		}

		logger.info("Starting in-memory MongoDB server for tests...");
		this.mongod = await MongoMemoryServer.create();
		const mongoUri = this.mongod.getUri();
		logger.info(`In-memory MongoDB server started at ${mongoUri}`);
		await mongoose.connect(mongoUri);

		// Apply database migrations to create views like ModSummary
		logger.info("Applying database migrations...");
		await applyDatabaseMigrations();
		logger.info("Database migrations applied");

		this.initialized = true;
	}

	static async cleanup(): Promise<void> {
		if (mongoose.connection.readyState === 1) {
			await mongoose.connection.close();
		}
		if (this.mongod) {
			await this.mongod.stop();
			this.mongod = null;
		}
		this.initialized = false;
	}

	static async clearDatabase(): Promise<void> {
		if (mongoose.connection.readyState !== 1) {
			return;
		}
		// Clear only the data collections, not the views
		const collections = mongoose.connection.collections;
		for (const key of Object.keys(collections)) {
			const collection = collections[key];
			if (collection) {
				// Skip view collections - they auto-update from their source
				const collectionInfo = await collection.options();
				if (!collectionInfo?.viewOn) {
					await collection.deleteMany({});
				}
			}
		}
	}
}

export const TestCases: TestCase[] = [
	{
		label: "TestApplication",
		build: () => {
			const testApp = new TestApplication();
			return {
				app: testApp,
				clear: async () => testApp.clear(),
				cleanup: async () => {},
				testAuthProvider: testApp.testAuthProvider,
				testModRepository: testApp.testModRepository,
				testUserRepository: testApp.testUserRepository,
				testDownloadsRepository: testApp.testDownloadsRepository,
			};
		},
	},
	{
		label: "ProdApplication",
		build: () => {
			const authProvider = new TestAuthenticationProvider();
			const prodApp = new ProdTestApplication(authProvider);

			return {
				app: prodApp,
				clear: async () => {
					await ProdTestApplication.clearDatabase();
				},
				cleanup: async () => {
					await ProdTestApplication.cleanup();
				},
				testAuthProvider: authProvider,
				// For ProdApplication, we don't expose test repositories directly
				// Tests should use the Application's public API
			};
		},
	},
];

/**
 * Initialize MongoDB for prod tests. Call this in beforeAll.
 */
export async function initializeProdTests(): Promise<void> {
	await ProdTestApplication.initialize();
}

/**
 * Cleanup MongoDB after prod tests. Call this in afterAll.
 */
export async function cleanupProdTests(): Promise<void> {
	await ProdTestApplication.cleanup();
}
