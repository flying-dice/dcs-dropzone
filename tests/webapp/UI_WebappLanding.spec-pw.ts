import test, { expect } from "playwright/test";
import {
	DISCOVER_BUTTON_TEST_ID,
	FEATURED_MODS_SECTION_TEST_ID,
	HEADER_LOGO_TEST_ID,
	LIBRARY_BUTTON_TEST_ID,
	LOGIN_BUTTON_TEST_ID,
	POPULAR_MODS_SECTION_TEST_ID,
	SETTINGS_BUTTON_TEST_ID,
	STAT_CARD_DOWNLOADS_TEST_ID,
	STAT_CARD_ENABLED_TEST_ID,
	STAT_CARD_TOTAL_DOWNLOADS_TEST_ID,
	STAT_CARD_TOTAL_MODS_TEST_ID,
	STAT_CARD_UPDATES_TEST_ID,
} from "../../packages/testids/src/index.ts";

test.describe("Webapp Health: UI Tests", () => {
	test("GET / renders page structure", async ({ page }) => {
		await page.goto("/");

		await expect(page.getByTestId(HEADER_LOGO_TEST_ID)).toBeVisible();
		await expect(page.getByTestId(DISCOVER_BUTTON_TEST_ID)).toBeVisible();
		await expect(page.getByTestId(LIBRARY_BUTTON_TEST_ID)).toBeVisible();
		await expect(page.getByTestId(SETTINGS_BUTTON_TEST_ID)).toBeVisible();
		await expect(page.getByTestId(LOGIN_BUTTON_TEST_ID)).toBeVisible();

		await expect(page.getByTestId(STAT_CARD_TOTAL_MODS_TEST_ID)).toBeVisible();
		await expect(page.getByTestId(STAT_CARD_TOTAL_DOWNLOADS_TEST_ID)).toBeVisible();
		await expect(page.getByTestId(STAT_CARD_DOWNLOADS_TEST_ID)).toBeVisible();
		await expect(page.getByTestId(STAT_CARD_ENABLED_TEST_ID)).toBeVisible();
		await expect(page.getByTestId(STAT_CARD_UPDATES_TEST_ID)).toBeVisible();

		await expect(page.getByTestId(FEATURED_MODS_SECTION_TEST_ID)).toBeVisible();
		await expect(page.getByTestId(POPULAR_MODS_SECTION_TEST_ID)).toBeVisible();
	});
});
