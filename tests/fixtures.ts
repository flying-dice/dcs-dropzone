import { test as base } from "playwright/test";

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
