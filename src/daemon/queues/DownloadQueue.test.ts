import { describe, expect, it } from "bun:test";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { DownloadJobStatus } from "../../common/data.ts";
import { AppDatabase } from "../database/app-database.ts";
import { ddlExports } from "../database/db-ddl.ts";
import {
	T_DOWNLOAD_QUEUE,
	T_MOD_RELEASE_ASSETS,
	T_MOD_RELEASES,
} from "../database/schema.ts";
import { DownloadQueue } from "./DownloadQueue.ts";

describe("DownloadQueue", () => {
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
				name: "test.zip",
				isArchive: true,
				urls: ["https://example.com/test.zip"],
			})
			.run();

		return db;
	}

	it("should push a download job to the queue", () => {
		const db = setupTestDb();

		const queue = new DownloadQueue({
			db,
			wgetExecutablePath: "binaries/wget.exe",
		});

		queue.pushJob(
			"test-release-1",
			"asset-1",
			"download-1",
			"https://example.com/test.zip",
			"/tmp/downloads",
		);

		const jobs = db.select().from(T_DOWNLOAD_QUEUE).all();
		expect(jobs).toHaveLength(1);
		expect(jobs[0]?.id).toBe("download-1");
		// Note: status may be IN_PROGRESS because queue auto-starts on construction
		const status = jobs[0]?.status;
		expect(
			status === DownloadJobStatus.PENDING ||
				status === DownloadJobStatus.IN_PROGRESS,
		).toBe(true);
		expect(jobs[0]?.url).toBe("https://example.com/test.zip");
		expect(jobs[0]?.targetDirectory).toBe("/tmp/downloads");
		expect(jobs[0]?.releaseId).toBe("test-release-1");
		expect(jobs[0]?.releaseAssetId).toBe("asset-1");
	});

	it("should cancel download jobs for a release", () => {
		const db = setupTestDb();

		const queue = new DownloadQueue({
			db,
			wgetExecutablePath: "binaries/wget.exe",
		});

		queue.pushJob(
			"test-release-1",
			"asset-1",
			"download-1",
			"https://example.com/test1.zip",
			"/tmp/downloads",
		);

		queue.pushJob(
			"test-release-1",
			"asset-1",
			"download-2",
			"https://example.com/test2.zip",
			"/tmp/downloads",
		);

		// Verify jobs exist
		let jobs = db.select().from(T_DOWNLOAD_QUEUE).all();
		expect(jobs).toHaveLength(2);

		// Cancel jobs
		queue.cancelJobsForRelease("test-release-1");

		// Verify jobs were removed
		jobs = db.select().from(T_DOWNLOAD_QUEUE).all();
		expect(jobs).toHaveLength(0);
	});

	it("should calculate overall progress for a release", () => {
		const db = setupTestDb();

		// Insert download jobs with different progress
		db.insert(T_DOWNLOAD_QUEUE)
			.values({
				id: "download-1",
				releaseId: "test-release-1",
				releaseAssetId: "asset-1",
				url: "https://example.com/test1.zip",
				targetDirectory: "/tmp/downloads",
				progressPercent: 50,
				createdAt: new Date(),
				nextAttemptAfter: new Date(),
			})
			.run();

		db.insert(T_DOWNLOAD_QUEUE)
			.values({
				id: "download-2",
				releaseId: "test-release-1",
				releaseAssetId: "asset-1",
				url: "https://example.com/test2.zip",
				targetDirectory: "/tmp/downloads",
				progressPercent: 100,
				createdAt: new Date(),
				nextAttemptAfter: new Date(),
			})
			.run();

		const queue = new DownloadQueue({
			db,
			wgetExecutablePath: "binaries/wget.exe",
		});

		const progress = queue.getOverallProgressForRelease("test-release-1");
		expect(progress).toBe(75); // (50 + 100) / 2
	});

	it("should return 0 progress for release with no downloads", () => {
		const db = setupTestDb();

		const queue = new DownloadQueue({
			db,
			wgetExecutablePath: "binaries/wget.exe",
		});

		const progress = queue.getOverallProgressForRelease("non-existent-release");
		expect(progress).toBe(0);
	});

	it("should set default values correctly when pushing a job", () => {
		const db = setupTestDb();

		const queue = new DownloadQueue({
			db,
			wgetExecutablePath: "binaries/wget.exe",
		});

		queue.pushJob(
			"test-release-1",
			"asset-1",
			"download-1",
			"https://example.com/test.zip",
			"/tmp/downloads",
		);

		const jobs = db.select().from(T_DOWNLOAD_QUEUE).all();
		expect(jobs).toHaveLength(1);
		expect(jobs[0]?.attempt).toBe(0);
		expect(jobs[0]?.maxAttempts).toBe(3);
		expect(jobs[0]?.progressPercent).toBe(0);
		expect(jobs[0]?.createdAt).toBeInstanceOf(Date);
		expect(jobs[0]?.nextAttemptAfter).toBeInstanceOf(Date);
	});
});
