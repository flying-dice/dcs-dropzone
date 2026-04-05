import { randomUUID } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "./fixtures.ts";

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
	});

	test.describe("POST /api/toggle/:releaseId/enable", () => {
		test("returns 200 and ok:true when enabling a ready release", async ({ request }) => {
			const releaseId = `ready-${randomUUID()}`;
			const addRes = await request.post("/api/downloads", {
				data: {
					releaseId,
					modId: "test-mod-id",
					modName: "Test Mod",
					dependencies: [],
					version: "1.0.0",
					versionHash: Date.now().toString(),
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
			await request.post(`/api/toggle/${releaseId}/disable`);
			await request.delete(`/api/downloads/${releaseId}`);
		});

		test("returns 422 with ReleaseNotFound when release does not exist", async ({ request }) => {
			const enableRes = await request.post("/api/toggle/non-existent-id/enable");

			expect(enableRes.status()).toBe(422);
			const body = await enableRes.json();
			expect(body.reason).toBe("ReleaseNotFound");
		});

		test("returns 422 with ReleaseNotReady when release has incomplete jobs", async ({ request }) => {
			const releaseId = `notready-${randomUUID()}`;
			const addRes = await request.post("/api/downloads", {
				data: {
					releaseId,
					modId: "notready-mod-id",
					modName: "Not Ready Mod",
					dependencies: [],
					version: "1.0.0",
					versionHash: Date.now().toString(),
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
			await request.delete(`/api/downloads/${releaseId}`);
		});
	});

	test.describe("POST /api/toggle/:releaseId/disable", () => {
		test("returns 200 and ok:true when disabling an enabled release", async ({ request }) => {
			const releaseId = `disable-${randomUUID()}`;
			const addRes = await request.post("/api/downloads", {
				data: {
					releaseId,
					modId: "test-mod-id",
					modName: "Test Mod",
					dependencies: [],
					version: "1.0.0",
					versionHash: Date.now().toString(),
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
			await request.delete(`/api/downloads/${releaseId}`);
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
			const releaseId = `toggle-enable-${randomUUID()}`;
			const addRes = await request.post("/api/downloads", {
				data: {
					releaseId,
					modId: "test-mod-id",
					modName: "Test Mod",
					dependencies: [],
					version: "1.0.0",
					versionHash: Date.now().toString(),
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
			await request.post(`/api/toggle/${releaseId}/disable`);
			await request.delete(`/api/downloads/${releaseId}`);
		});

		test("returns 200 and disables an enabled release", async ({ request }) => {
			const releaseId = `toggle-disable-${randomUUID()}`;
			const addRes = await request.post("/api/downloads", {
				data: {
					releaseId,
					modId: "test-mod-id",
					modName: "Test Mod",
					dependencies: [],
					version: "1.0.0",
					versionHash: Date.now().toString(),
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
			await request.delete(`/api/downloads/${releaseId}`);
		});

		test("returns 422 with ReleaseNotFound when release does not exist", async ({ request }) => {
			const toggleRes = await request.post("/api/toggle/non-existent-id");

			expect(toggleRes.status()).toBe(422);
			const body = await toggleRes.json();
			expect(body.reason).toBe("ReleaseNotFound");
		});
	});
});
