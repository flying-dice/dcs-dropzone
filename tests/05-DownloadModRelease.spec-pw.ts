import { randomUUID } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DAEMON_BASE_URL, expect, test } from "./fixtures.ts";

const BASE_URL = "http://localhost:3000";

const MOD = {
	name: "Download Test Mod",
	description: "A test mod for verifying the download flow",
	category: "OTHER",
};

const RELEASE = {
	version: "1.0.0",
	changelog: "Initial release for download test",
};

const ASSET = {
	id: randomUUID(),
	name: "hello-world",
	urls: [
		{
			id: randomUUID(),
			url: "https://github.com/flying-dice/hello-world-mod/releases/download/0.1.0/hello-world.lua",
		},
	],
	isArchive: false,
};

const SYMLINK = {
	id: randomUUID(),
	name: "hello-world.lua",
	src: "hello-world.lua",
	destRoot: "DCS_WORKING_DIR",
	dest: "Scripts/Hooks/hello-world.lua",
};

test.describe("05 - Download Mod Release: E2E", () => {
	let tempDir: string;

	test.beforeAll(() => {
		tempDir = mkdtempSync(join(tmpdir(), "pw-download-release-"));
	});

	test.afterAll(() => {
		rmSync(tempDir, { recursive: true, force: true });
	});

	test("Downloads a mod release to the daemon end-to-end", async ({ page, request }) => {
		// Increase timeout for the full E2E flow including download
		test.setTimeout(120_000);

		// ── Step 1 — Configure daemon settings ──────────────────────────────────
		const dcsWorkingDir = join(tempDir, "dcs-working");
		const dcsInstallDir = join(tempDir, "dcs-install");
		const dropzoneModsDir = join(tempDir, "mods");
		mkdirSync(dcsWorkingDir, { recursive: true });
		mkdirSync(dcsInstallDir, { recursive: true });
		mkdirSync(dropzoneModsDir, { recursive: true });

		const settingsRes = await request.put(`${DAEMON_BASE_URL}/api/settings`, {
			data: { dcsWorkingDir, dcsInstallDir, dropzoneModsDir },
		});
		expect(settingsRes.ok()).toBeTruthy();

		// ── Step 2 — Login ──────────────────────────────────────────────────────
		await page.goto(BASE_URL);

		const loginButton = page.getByTestId("login-button");
		await expect(loginButton).toBeVisible();
		await loginButton.click();
		await expect(page.getByTestId("user-avatar")).toBeVisible({ timeout: 10_000 });

		// ── Step 3 — Clean up stale data from previous runs/retries ─────────────
		const userModsRes = await page.request.get(`${BASE_URL}/api/user-mods`);
		if (userModsRes.ok()) {
			const body = await userModsRes.json();
			for (const mod of (body.data as Array<{ id: string; name: string }>) ?? []) {
				if (mod.name === MOD.name) {
					// Also clean up any daemon downloads for this mod's releases
					const daemonDownloads = await request.get(`${DAEMON_BASE_URL}/api/downloads`);
					if (daemonDownloads.ok()) {
						const downloads = await daemonDownloads.json();
						for (const dl of downloads as Array<{ modId: string; releaseId: string }>) {
							if (dl.modId === mod.id) {
								await request.delete(`${DAEMON_BASE_URL}/api/downloads/${dl.releaseId}`);
							}
						}
					}
					await page.request.delete(`${BASE_URL}/api/user-mods/${mod.id}`);
				}
			}
		}

		// ── Step 4 — Create mod via API ──────────────────────────────────────────
		const createModRes = await page.request.post(`${BASE_URL}/api/user-mods`, {
			data: MOD,
		});
		expect(createModRes.ok()).toBeTruthy();
		const modData = await createModRes.json();
		const modId: string = modData.id;

		// ── Step 5 — Create release via API ─────────────────────────────────────
		const createReleaseRes = await page.request.post(`${BASE_URL}/api/user-mods/${modId}/releases`, {
			data: { version: RELEASE.version },
		});
		expect(createReleaseRes.ok()).toBeTruthy();
		const releaseData = await createReleaseRes.json();
		const releaseId: string = releaseData.id;

		// ── Step 6 — Update release with assets, symlinks, and PUBLIC visibility ─
		const updateReleaseRes = await page.request.put(`${BASE_URL}/api/user-mods/${modId}/releases/${releaseId}`, {
			data: {
				version: RELEASE.version,
				changelog: RELEASE.changelog,
				assets: [ASSET],
				symbolicLinks: [SYMLINK],
				missionScripts: [],
				visibility: "PUBLIC",
			},
		});
		expect(updateReleaseRes.ok()).toBeTruthy();

		// ── Step 7 — Update mod visibility to PUBLIC ────────────────────────────
		const updateModRes = await page.request.put(`${BASE_URL}/api/user-mods/${modId}`, {
			data: {
				...modData,
				visibility: "PUBLIC",
			},
		});
		expect(updateModRes.ok()).toBeTruthy();

		// ── Step 8 — Navigate to the public mod page ────────────────────────────
		await page.goto(`${BASE_URL}/#/mods/${modId}/${releaseId}`);

		// Verify mod page loaded with correct data
		await expect(page.getByText(MOD.name)).toBeVisible({ timeout: 10_000 });

		// ── Step 9 — Click the Download button ──────────────────────────────────
		const downloadButton = page.getByTestId("download-release-button");
		await expect(downloadButton).toBeVisible({ timeout: 10_000 });
		await expect(downloadButton).toBeEnabled();
		await downloadButton.click();

		// ── Step 10 — Verify download progress is displayed ─────────────────────
		// After clicking download, a success notification should appear
		await expect(page.locator(".mantine-Notification-root").last()).toBeVisible({ timeout: 10_000 });

		// The Download button should transition to a Remove/Cancel button
		await expect(page.getByTestId("remove-release-button")).toBeVisible({ timeout: 15_000 });

		// ── Step 11 — Wait for download jobs to complete ────────────────────────
		// Poll the daemon API until the release status is no longer IN_PROGRESS/PENDING
		await expect(async () => {
			const downloadsRes = await request.get(`${DAEMON_BASE_URL}/api/downloads`);
			expect(downloadsRes.ok()).toBeTruthy();
			const downloads = await downloadsRes.json();
			const release = (downloads as Array<{ releaseId: string; status: string }>).find(
				(d) => d.releaseId === releaseId,
			);
			expect(release).toBeDefined();
			expect(release!.status).not.toBe("IN_PROGRESS");
			expect(release!.status).not.toBe("PENDING");
		}).toPass({ timeout: 60_000, intervals: [1_000, 2_000, 5_000] });

		// ── Step 12 — Verify release in GET /api/downloads with correct status ──
		const finalDownloadsRes = await request.get(`${DAEMON_BASE_URL}/api/downloads`);
		expect(finalDownloadsRes.ok()).toBeTruthy();
		const finalDownloads = await finalDownloadsRes.json();
		const downloadedRelease = (
			finalDownloads as Array<{
				releaseId: string;
				modId: string;
				modName: string;
				version: string;
				status: string;
			}>
		).find((d) => d.releaseId === releaseId);

		expect(downloadedRelease).toBeDefined();
		expect(downloadedRelease!.modId).toBe(modId);
		expect(downloadedRelease!.modName).toBe(MOD.name);
		expect(downloadedRelease!.version).toBe(RELEASE.version);
		expect(downloadedRelease!.status).toBe("DISABLED");

		// ── Step 13 — Navigate to Downloaded page and verify ────────────────────
		await page.getByTestId("nav-downloaded").click();
		await expect(page).toHaveURL(/#\/downloaded$/);

		// Verify the mod name appears in the downloaded table
		await expect(page.getByText(MOD.name)).toBeVisible({ timeout: 10_000 });
		// Verify the version is displayed
		await expect(page.getByText(RELEASE.version)).toBeVisible();

		// ── Step 14 — Cleanup: remove from daemon and delete mod ────────────────
		await request.delete(`${DAEMON_BASE_URL}/api/downloads/${releaseId}`);
		await page.request.delete(`${BASE_URL}/api/user-mods/${modId}`);
	});
});
