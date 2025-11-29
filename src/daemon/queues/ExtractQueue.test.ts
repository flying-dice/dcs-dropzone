import { describe, expect, it } from "bun:test";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { DownloadJobStatus, ExtractJobStatus } from "../../common/data.ts";
import { AppDatabase } from "../database/app-database.ts";
import { ddlExports } from "../database/db-ddl.ts";
import {
	T_DOWNLOAD_QUEUE,
	T_EXTRACT_DOWNLOAD_JOIN,
	T_EXTRACT_QUEUE,
	T_MOD_RELEASE_ASSETS,
	T_MOD_RELEASES,
} from "../database/schema.ts";
import { ExtractQueue } from "./ExtractQueue.ts";

describe("ExtractQueue", () => {
	function setupTestDb() {
		const appDb = AppDatabase.withMigrations(":memory:", ddlExports);
		const db = drizzle({ client: appDb.getDatabase() });

		// Insert test release and asset
		db.insert(T_MOD_RELEASES)
			.values({
				releaseId: "test-release-1",
				modId: "test-mod",
				modName: "Test Mod",
				version: "1.0.0",
			})
			.run();

		db.insert(T_MOD_RELEASE_ASSETS)
			.values({
				id: "asset-1",
				releaseId: "test-release-1",
				name: "test.7z",
				isArchive: true,
				urls: ["https://example.com/test.7z"],
			})
			.run();

		return db;
	}

	it("should push an extract job to the queue", () => {
		const db = setupTestDb();

		// Insert download job first - but leave it PENDING so the extract job won't process
		db.insert(T_DOWNLOAD_QUEUE)
			.values({
				id: "download-1",
				releaseId: "test-release-1",
				releaseAssetId: "asset-1",
				url: "https://example.com/test.7z",
				targetDirectory: "/tmp/downloads",
				status: DownloadJobStatus.PENDING,
				createdAt: new Date(),
				nextAttemptAfter: new Date(),
			})
			.run();

		const queue = new ExtractQueue({
			db,
			sevenzipExecutablePath: "binaries/7za.exe",
		});

		queue.pushJob(
			"test-release-1",
			"asset-1",
			"extract-1",
			"/tmp/downloads/test.7z",
			"/tmp/extracted",
			["download-1"],
		);

		const jobs = db.select().from(T_EXTRACT_QUEUE).all();
		expect(jobs).toHaveLength(1);
		expect(jobs[0]?.id).toBe("extract-1");
		// Job won't start because dependent download is not completed
		expect(jobs[0]?.status).toBe(ExtractJobStatus.PENDING);
		expect(jobs[0]?.archivePath).toBe("/tmp/downloads/test.7z");
		expect(jobs[0]?.targetDirectory).toBe("/tmp/extracted");
	});

	it("should create join table entries for download dependencies", () => {
		const db = setupTestDb();

		// Insert download jobs first
		db.insert(T_DOWNLOAD_QUEUE)
			.values({
				id: "download-1",
				releaseId: "test-release-1",
				releaseAssetId: "asset-1",
				url: "https://example.com/test.7z.001",
				targetDirectory: "/tmp/downloads",
				status: DownloadJobStatus.COMPLETED,
				createdAt: new Date(),
				nextAttemptAfter: new Date(),
			})
			.run();

		db.insert(T_DOWNLOAD_QUEUE)
			.values({
				id: "download-2",
				releaseId: "test-release-1",
				releaseAssetId: "asset-1",
				url: "https://example.com/test.7z.002",
				targetDirectory: "/tmp/downloads",
				status: DownloadJobStatus.COMPLETED,
				createdAt: new Date(),
				nextAttemptAfter: new Date(),
			})
			.run();

		const queue = new ExtractQueue({
			db,
			sevenzipExecutablePath: "binaries/7za.exe",
		});

		queue.pushJob(
			"test-release-1",
			"asset-1",
			"extract-1",
			"/tmp/downloads/test.7z.001",
			"/tmp/extracted",
			["download-1", "download-2"],
		);

		const joinEntries = db.select().from(T_EXTRACT_DOWNLOAD_JOIN).all();
		expect(joinEntries).toHaveLength(2);
		expect(joinEntries.map((e) => e.downloadJobId).sort()).toEqual([
			"download-1",
			"download-2",
		]);
	});

	it("should cancel extract jobs for a release", () => {
		const db = setupTestDb();

		// Insert download job first
		db.insert(T_DOWNLOAD_QUEUE)
			.values({
				id: "download-1",
				releaseId: "test-release-1",
				releaseAssetId: "asset-1",
				url: "https://example.com/test.7z",
				targetDirectory: "/tmp/downloads",
				status: DownloadJobStatus.COMPLETED,
				createdAt: new Date(),
				nextAttemptAfter: new Date(),
			})
			.run();

		const queue = new ExtractQueue({
			db,
			sevenzipExecutablePath: "binaries/7za.exe",
		});

		queue.pushJob(
			"test-release-1",
			"asset-1",
			"extract-1",
			"/tmp/downloads/test.7z",
			"/tmp/extracted",
			["download-1"],
		);

		// Verify job exists
		let jobs = db.select().from(T_EXTRACT_QUEUE).all();
		expect(jobs).toHaveLength(1);

		// Cancel jobs
		queue.cancelJobsForRelease("test-release-1");

		// Verify job was removed
		jobs = db.select().from(T_EXTRACT_QUEUE).all();
		expect(jobs).toHaveLength(0);

		// Verify join table was also cleaned up
		const joinEntries = db.select().from(T_EXTRACT_DOWNLOAD_JOIN).all();
		expect(joinEntries).toHaveLength(0);
	});

	it("should calculate overall progress for a release", () => {
		const db = setupTestDb();

		// Insert extract jobs with different progress
		db.insert(T_EXTRACT_QUEUE)
			.values({
				id: "extract-1",
				releaseId: "test-release-1",
				releaseAssetId: "asset-1",
				archivePath: "/tmp/test1.7z",
				targetDirectory: "/tmp/extracted1",
				progressPercent: 50,
				createdAt: new Date(),
				nextAttemptAfter: new Date(),
			})
			.run();

		db.insert(T_EXTRACT_QUEUE)
			.values({
				id: "extract-2",
				releaseId: "test-release-1",
				releaseAssetId: "asset-1",
				archivePath: "/tmp/test2.7z",
				targetDirectory: "/tmp/extracted2",
				progressPercent: 100,
				createdAt: new Date(),
				nextAttemptAfter: new Date(),
			})
			.run();

		const queue = new ExtractQueue({
			db,
			sevenzipExecutablePath: "binaries/7za.exe",
		});

		const progress = queue.getOverallProgressForRelease("test-release-1");
		expect(progress).toBe(75); // (50 + 100) / 2
	});
});
