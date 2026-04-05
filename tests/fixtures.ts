import { test as base } from "playwright/test";

/** Base URL for the daemon server used by Playwright tests. */
export const DAEMON_BASE_URL = "http://127.0.0.1:56499";

/**
 * Extends the base `test` to add a short delay after each test so that
 * recorded videos include the final state rather than cutting off immediately.
 */
export const test = base.extend<{ page: ReturnType<typeof base.extend> }>({
	page: async ({ page }, use) => {
		await use(page);
		await page.waitForTimeout(2000);
	},
});

export { expect } from "playwright/test";
