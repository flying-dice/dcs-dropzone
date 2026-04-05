import { expect, test } from "./fixtures.ts";

test.describe("01 - Daemon Connectivity: Webapp UI Tests", () => {
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
		// Intercept all requests to the daemon and abort them to simulate unreachable daemon
		await page.route(/(localhost|127\.0\.0\.1):56499/, (route) => route.abort());

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
