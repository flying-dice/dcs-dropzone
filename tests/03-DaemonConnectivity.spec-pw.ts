import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DAEMON_BASE_URL, expect, test } from "./fixtures.ts";

test.describe("03 - Daemon Connectivity: Webapp UI Tests", () => {
	let tempDir: string;

	test.beforeAll(() => {
		tempDir = mkdtempSync(join(tmpdir(), "pw-daemon-connectivity-"));
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

		await request.put(`${DAEMON_BASE_URL}/api/settings`, {
			data: { dcsWorkingDir, dcsInstallDir, dropzoneModsDir },
		});
	});

	test("Shows connected status when daemon is reachable", async ({ page }) => {
		await page.goto("/");

		// Wait for the daemon activity button to be visible
		const activityButton = page.getByTestId("daemon-activity-button");
		await expect(activityButton).toBeVisible({ timeout: 10_000 });

		// Click to open the popover
		await activityButton.click();

		// When daemon is running and connected, should show "No active downloads"
		await expect(page.getByText("No active downloads")).toBeVisible({ timeout: 10_000 });
	});

	test("Shows error status when daemon is unreachable", async ({ page }) => {
		// Intercept all browser requests to the daemon and abort them to simulate unreachable daemon
		await page.route(new RegExp(DAEMON_BASE_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), (route) => route.abort());

		await page.goto("/");

		// Wait for the daemon activity button to be visible
		const activityButton = page.getByTestId("daemon-activity-button");
		await expect(activityButton).toBeVisible({ timeout: 10_000 });

		// Click to open the popover
		await activityButton.click();

		// When daemon is unreachable, should show connection error
		await expect(page.getByText("Error connecting to daemon")).toBeVisible({ timeout: 10_000 });
	});
});
