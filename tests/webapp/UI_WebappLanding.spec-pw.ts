import test, { expect } from "playwright/test";
import {
	DISCOVER_BUTTON_TEST_ID,
	HEADER_LOGO_TEST_ID,
	LIBRARY_BUTTON_TEST_ID,
	LOGIN_BUTTON_TEST_ID,
	SETTINGS_BUTTON_TEST_ID,
} from "../../playwright.constants.ts";

test.describe("Webapp Health: UI Tests", () => {
	test("GET / renders page structure", async ({ page }) => {
		await page.goto("/");

		const header = [
			page.getByTestId(HEADER_LOGO_TEST_ID),
			page.getByTestId(DISCOVER_BUTTON_TEST_ID),
			page.getByTestId(LIBRARY_BUTTON_TEST_ID),
			page.getByTestId(SETTINGS_BUTTON_TEST_ID),
			page.getByTestId(LOGIN_BUTTON_TEST_ID),
		];

		for (const element of header) {
			await expect(element).toBeVisible();
		}
	});
});
