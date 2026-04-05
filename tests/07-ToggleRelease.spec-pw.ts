import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DAEMON_BASE_URL, expect, test } from "./fixtures.ts";

const BASE_URL = "http://localhost:3000";

const MOD = {
	name: "Toggle Test Mod",
	description: "A test mod for verifying the enable/disable toggle flow",
	category: "OTHER",
};

const RELEASE = {
	version: "1.0.0",
	changelog: "Initial release for toggle test",
};

const ASSET = {
	id: "test-07-asset-1",
	name: "hello-world",
	urls: [
		{
			id: "test-07-asset-1-url-1",
			url: "https://github.com/flying-dice/hello-world-mod/releases/download/0.1.0/hello-world.lua",
		},
	],
	isArchive: false,
};

const SYMLINK = {
	id: "test-07-symlink-1",
	name: "hello-world.lua",
	src: "hello-world.lua",
	destRoot: "DCS_WORKING_DIR",
	dest: "Scripts/Hooks/hello-world.lua",
};

/** Deterministic release ID for the ReleaseNotReady test. */
const NOT_READY_RELEASE_ID = "test-07-not-ready-release";

test.describe("07 - Toggle Release: E2E", () => {
	let tempDir: string;

	test.beforeAll(() => {
		tempDir = mkdtempSync(join(tmpdir(), "pw-toggle-release-"));
	});

	test.afterAll(() => {
		rmSync(tempDir, { recursive: true, force: true });
	});

	test("Enables and disables a fully downloaded release via the UI", async ({ page, request }) => {
		// Increase timeout for the full E2E flow including download
		test.setTimeout(120_000);

		// ── Step 1 — Configure daemon settings ──────────────────────────────────
		const dcsWorkingDir = join(tempDir, "dcs-working");
		const dcsInstallDir = join(tempDir, "dcs-install");
		const dropzoneModsDir = join(tempDir, "mods");
		mkdirSync(dcsWorkingDir, { recursive: true });
		mkdirSync(dcsInstallDir, { recursive: true });
		mkdirSync(dropzoneModsDir, { recursive: true });
		// Create the symlink destination directory so enable can create symlinks
		mkdirSync(join(dcsWorkingDir, "Scripts", "Hooks"), { recursive: true });

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
					const daemonDownloads = await request.get(`${DAEMON_BASE_URL}/api/downloads`);
					if (daemonDownloads.ok()) {
						const downloads = await daemonDownloads.json();
						for (const dl of downloads as Array<{ modId: string; releaseId: string }>) {
							if (dl.modId === mod.id) {
								// Disable before removing in case it's enabled
								await request.post(`${DAEMON_BASE_URL}/api/toggle/${dl.releaseId}/disable`);
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
		await expect(page.getByText(MOD.name)).toBeVisible({ timeout: 10_000 });

		// ── Step 9 — Click the Download button ──────────────────────────────────
		const downloadButton = page.getByTestId("download-release-button");
		await expect(downloadButton).toBeVisible({ timeout: 10_000 });
		await expect(downloadButton).toBeEnabled();
		await downloadButton.click();

		// ── Step 10 — Wait for download to complete ─────────────────────────────
		await expect(page.getByTestId("remove-release-button")).toBeVisible({ timeout: 15_000 });

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

		// Verify release is DISABLED after download
		const afterDownloadRes = await request.get(`${DAEMON_BASE_URL}/api/downloads`);
		expect(afterDownloadRes.ok()).toBeTruthy();
		const afterDownload = (await afterDownloadRes.json()) as Array<{ releaseId: string; status: string }>;
		expect(afterDownload.find((d) => d.releaseId === releaseId)?.status).toBe("DISABLED");

		// ── Step 11 — Enable the release via the toggle button ──────────────────
		const toggleButton = page.getByTestId("toggle-release-button");
		await expect(toggleButton).toBeVisible({ timeout: 10_000 });
		await expect(toggleButton).toHaveText("Enable");
		await toggleButton.click();

		// Wait for success notification
		await expect(page.locator(".mantine-Notification-root").last()).toBeVisible({ timeout: 10_000 });

		// ── Step 12 — Verify ENABLED status via API ─────────────────────────────
		await expect(async () => {
			const downloadsRes = await request.get(`${DAEMON_BASE_URL}/api/downloads`);
			expect(downloadsRes.ok()).toBeTruthy();
			const downloads = (await downloadsRes.json()) as Array<{ releaseId: string; status: string }>;
			expect(downloads.find((d) => d.releaseId === releaseId)?.status).toBe("ENABLED");
		}).toPass({ timeout: 10_000, intervals: [500, 1_000] });

		// Verify the UI reflects ENABLED state — button should now say "Disable"
		await expect(toggleButton).toHaveText("Disable", { timeout: 10_000 });

		// ── Step 13 — Disable the release via the toggle button ─────────────────
		await toggleButton.click();

		// Wait for success notification
		await expect(page.locator(".mantine-Notification-root").last()).toBeVisible({ timeout: 10_000 });

		// ── Step 14 — Verify DISABLED status via API ────────────────────────────
		await expect(async () => {
			const downloadsRes = await request.get(`${DAEMON_BASE_URL}/api/downloads`);
			expect(downloadsRes.ok()).toBeTruthy();
			const downloads = (await downloadsRes.json()) as Array<{ releaseId: string; status: string }>;
			expect(downloads.find((d) => d.releaseId === releaseId)?.status).toBe("DISABLED");
		}).toPass({ timeout: 10_000, intervals: [500, 1_000] });

		// Verify the UI reflects DISABLED state — button should now say "Enable"
		await expect(toggleButton).toHaveText("Enable", { timeout: 10_000 });

		// ── Step 15 — Cleanup: disable, remove from daemon and delete mod ────────
		await request.post(`${DAEMON_BASE_URL}/api/toggle/${releaseId}/disable`);
		await request.delete(`${DAEMON_BASE_URL}/api/downloads/${releaseId}`);
		await page.request.delete(`${BASE_URL}/api/user-mods/${modId}`);
	});

	test("Returns ReleaseNotReady when enabling a release with incomplete jobs", async ({ request }) => {
		// ── Step 1 — Configure daemon settings ──────────────────────────────────
		const dcsWorkingDir = join(tempDir, "dcs-working-notready");
		const dropzoneModsDir = join(tempDir, "mods-notready");
		mkdirSync(dcsWorkingDir, { recursive: true });
		mkdirSync(dropzoneModsDir, { recursive: true });

		await request.put(`${DAEMON_BASE_URL}/api/settings`, {
			data: { dcsWorkingDir, dcsInstallDir: join(tempDir, "dcs-install-notready"), dropzoneModsDir },
		});

		// ── Step 2 — Clean up stale release from a prior failed attempt ─────────
		await request.post(`${DAEMON_BASE_URL}/api/toggle/${NOT_READY_RELEASE_ID}/disable`);
		await request.delete(`${DAEMON_BASE_URL}/api/downloads/${NOT_READY_RELEASE_ID}`);

		// ── Step 3 — Add a release with assets directly to the daemon ───────────
		// This release has assets so it won't be immediately ready (jobs will be pending/in-progress)
		const addRes = await request.post(`${DAEMON_BASE_URL}/api/downloads`, {
			data: {
				releaseId: NOT_READY_RELEASE_ID,
				modId: "test-07-notready-mod",
				modName: "Not Ready Mod",
				dependencies: [],
				version: "1.0.0",
				versionHash: "hash-07-not-ready",
				assets: [
					{
						id: `${NOT_READY_RELEASE_ID}__asset-1`,
						name: "some-asset",
						urls: [
							{
								id: `${NOT_READY_RELEASE_ID}__asset-1__url-1`,
								url: "https://example.com/nonexistent-file-that-will-not-complete.zip",
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

		// ── Step 4 — Attempt to enable — should fail with ReleaseNotReady ───────
		const enableRes = await request.post(`${DAEMON_BASE_URL}/api/toggle/${NOT_READY_RELEASE_ID}/enable`);

		expect(enableRes.status()).toBe(422);
		const body = await enableRes.json();
		expect(body.reason).toBe("ReleaseNotReady");

		// ── Cleanup ─────────────────────────────────────────────────────────────
		await request.delete(`${DAEMON_BASE_URL}/api/downloads/${NOT_READY_RELEASE_ID}`);
	});

	test("Returns ReleaseNotFound when toggling a non-existent release", async ({ request }) => {
		const enableRes = await request.post(`${DAEMON_BASE_URL}/api/toggle/non-existent-release-id/enable`);

		expect(enableRes.status()).toBe(422);
		const enableBody = await enableRes.json();
		expect(enableBody.reason).toBe("ReleaseNotFound");

		const disableRes = await request.post(`${DAEMON_BASE_URL}/api/toggle/non-existent-release-id/disable`);

		expect(disableRes.status()).toBe(422);
		const disableBody = await disableRes.json();
		expect(disableBody.reason).toBe("ReleaseNotFound");
	});
});
