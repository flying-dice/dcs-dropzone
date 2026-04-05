import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "./fixtures.ts";

/** Deterministic release IDs — one per test case — so retries reuse the same ID and cleanup is reliable. */
const RELEASE_IDS = {
	enableReady: "test-06-enable-ready",
	enableNotReady: "test-06-enable-not-ready",
	disableEnabled: "test-06-disable-enabled",
	toggleEnable: "test-06-toggle-enable",
	toggleDisable: "test-06-toggle-disable",
};

/** Remove a release from the daemon, ignoring 404 / already-absent. */
async function cleanupRelease(
	request: { post: (...args: never) => unknown; delete: (...args: never) => unknown },
	releaseId: string,
) {
	await request.post(`/api/toggle/${releaseId}/disable`);
	await request.delete(`/api/downloads/${releaseId}`);
}

test.describe("06 - Daemon Toggle: API Tests", () => {
	let tempDir: string;

	test.beforeAll(() => {
		tempDir = mkdtempSync(join(tmpdir(), "pw-daemon-toggle-"));
	});

	test.afterAll(() => {
		rmSync(tempDir, { recursive: true, force: true });
	});

	test.beforeEach(async ({ request }) => {
		const dcsWorkingDir = join(tempDir, "dcs-working");
		const dcsInstallDir = join(tempDir, "dcs-install");
		const dropzoneModsDir = join(tempDir, "mods");
		mkdirSync(dcsWorkingDir, { recursive: true });
		mkdirSync(dcsInstallDir, { recursive: true });
		mkdirSync(dropzoneModsDir, { recursive: true });

		await request.put("/api/settings", {
			data: { dcsWorkingDir, dcsInstallDir, dropzoneModsDir },
		});

		// Deterministic cleanup — remove any stale releases left by a previous failed attempt
		for (const id of Object.values(RELEASE_IDS)) {
			await cleanupRelease(request, id);
		}
	});

	test.describe("POST /api/toggle/:releaseId/enable", () => {
		test("returns 200 and ok:true when enabling a ready release", async ({ request }) => {
			const releaseId = RELEASE_IDS.enableReady;
			const addRes = await request.post("/api/downloads", {
				data: {
					releaseId,
					modId: "test-06-mod",
					modName: "Test Mod",
					dependencies: [],
					version: "1.0.0",
					versionHash: "hash-06-enable-ready",
					assets: [],
					symbolicLinks: [],
					missionScripts: [],
				},
			});
			expect(addRes.ok()).toBeTruthy();

			const enableRes = await request.post(`/api/toggle/${releaseId}/enable`);

			expect(enableRes.status()).toBe(200);
			expect(await enableRes.json()).toEqual({ ok: true });

			// Verify status is ENABLED via GET /api/downloads
			const downloadsRes = await request.get("/api/downloads");
			const downloads = (await downloadsRes.json()) as Array<{ releaseId: string; status: string }>;
			expect(downloads.find((d) => d.releaseId === releaseId)?.status).toBe("ENABLED");

			// Cleanup
			await cleanupRelease(request, releaseId);
		});

		test("returns 422 with ReleaseNotFound when release does not exist", async ({ request }) => {
			const enableRes = await request.post("/api/toggle/non-existent-id/enable");

			expect(enableRes.status()).toBe(422);
			const body = await enableRes.json();
			expect(body.reason).toBe("ReleaseNotFound");
		});

		test("returns 422 with ReleaseNotReady when release has incomplete jobs", async ({ request }) => {
			const releaseId = RELEASE_IDS.enableNotReady;
			const addRes = await request.post("/api/downloads", {
				data: {
					releaseId,
					modId: "test-06-notready-mod",
					modName: "Not Ready Mod",
					dependencies: [],
					version: "1.0.0",
					versionHash: "hash-06-enable-not-ready",
					assets: [
						{
							id: `${releaseId}__asset-1`,
							name: "some-asset",
							urls: [
								{
									id: `${releaseId}__asset-1__url-1`,
									url: "https://example.com/nonexistent-file.zip",
								},
							],
							isArchive: true,
						},
					],
					symbolicLinks: [],
					missionScripts: [],
				},
			});
			expect(addRes.ok()).toBeTruthy();

			const enableRes = await request.post(`/api/toggle/${releaseId}/enable`);

			expect(enableRes.status()).toBe(422);
			const body = await enableRes.json();
			expect(body.reason).toBe("ReleaseNotReady");
			expect(body.pendingCount).toBeGreaterThanOrEqual(0);
			expect(body.failedCount).toBeGreaterThanOrEqual(0);

			// Cleanup
			await cleanupRelease(request, releaseId);
		});
	});

	test.describe("POST /api/toggle/:releaseId/disable", () => {
		test("returns 200 and ok:true when disabling an enabled release", async ({ request }) => {
			const releaseId = RELEASE_IDS.disableEnabled;
			const addRes = await request.post("/api/downloads", {
				data: {
					releaseId,
					modId: "test-06-mod",
					modName: "Test Mod",
					dependencies: [],
					version: "1.0.0",
					versionHash: "hash-06-disable-enabled",
					assets: [],
					symbolicLinks: [],
					missionScripts: [],
				},
			});
			expect(addRes.ok()).toBeTruthy();

			// Enable first
			const enableRes = await request.post(`/api/toggle/${releaseId}/enable`);
			expect(enableRes.ok()).toBeTruthy();

			// Now disable
			const disableRes = await request.post(`/api/toggle/${releaseId}/disable`);

			expect(disableRes.status()).toBe(200);
			expect(await disableRes.json()).toEqual({ ok: true });

			// Verify status is DISABLED via GET /api/downloads
			const downloadsRes = await request.get("/api/downloads");
			const downloads = (await downloadsRes.json()) as Array<{ releaseId: string; status: string }>;
			expect(downloads.find((d) => d.releaseId === releaseId)?.status).toBe("DISABLED");

			// Cleanup
			await cleanupRelease(request, releaseId);
		});

		test("returns 422 with ReleaseNotFound when release does not exist", async ({ request }) => {
			const disableRes = await request.post("/api/toggle/non-existent-id/disable");

			expect(disableRes.status()).toBe(422);
			const body = await disableRes.json();
			expect(body.reason).toBe("ReleaseNotFound");
		});
	});

	test.describe("POST /api/toggle/:releaseId", () => {
		test("returns 200 and enables a disabled release", async ({ request }) => {
			const releaseId = RELEASE_IDS.toggleEnable;
			const addRes = await request.post("/api/downloads", {
				data: {
					releaseId,
					modId: "test-06-mod",
					modName: "Test Mod",
					dependencies: [],
					version: "1.0.0",
					versionHash: "hash-06-toggle-enable",
					assets: [],
					symbolicLinks: [],
					missionScripts: [],
				},
			});
			expect(addRes.ok()).toBeTruthy();

			const toggleRes = await request.post(`/api/toggle/${releaseId}`);

			expect(toggleRes.status()).toBe(200);
			expect(await toggleRes.json()).toEqual({ ok: true });

			// Verify status is ENABLED
			const downloadsRes = await request.get("/api/downloads");
			const downloads = (await downloadsRes.json()) as Array<{ releaseId: string; status: string }>;
			expect(downloads.find((d) => d.releaseId === releaseId)?.status).toBe("ENABLED");

			// Cleanup
			await cleanupRelease(request, releaseId);
		});

		test("returns 200 and disables an enabled release", async ({ request }) => {
			const releaseId = RELEASE_IDS.toggleDisable;
			const addRes = await request.post("/api/downloads", {
				data: {
					releaseId,
					modId: "test-06-mod",
					modName: "Test Mod",
					dependencies: [],
					version: "1.0.0",
					versionHash: "hash-06-toggle-disable",
					assets: [],
					symbolicLinks: [],
					missionScripts: [],
				},
			});
			expect(addRes.ok()).toBeTruthy();

			// Enable first
			const enableRes = await request.post(`/api/toggle/${releaseId}/enable`);
			expect(enableRes.ok()).toBeTruthy();

			// Toggle should disable
			const toggleRes = await request.post(`/api/toggle/${releaseId}`);

			expect(toggleRes.status()).toBe(200);
			expect(await toggleRes.json()).toEqual({ ok: true });

			// Verify status is DISABLED
			const downloadsRes = await request.get("/api/downloads");
			const downloads = (await downloadsRes.json()) as Array<{ releaseId: string; status: string }>;
			expect(downloads.find((d) => d.releaseId === releaseId)?.status).toBe("DISABLED");

			// Cleanup
			await cleanupRelease(request, releaseId);
		});

		test("returns 422 with ReleaseNotFound when release does not exist", async ({ request }) => {
			const toggleRes = await request.post("/api/toggle/non-existent-id");

			expect(toggleRes.status()).toBe(422);
			const body = await toggleRes.json();
			expect(body.reason).toBe("ReleaseNotFound");
		});
	});
});
