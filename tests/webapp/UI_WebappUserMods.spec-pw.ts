import test, { expect } from "playwright/test";
import {
	LOGIN_BUTTON_TEST_ID,
	MY_MODS_BUTTON_TEST_ID,
	USER_MODS_PUBLISH_NEW_MOD_BTN_TEST_ID,
	USER_MODS_PUBLISHED_MODS_TEST_ID,
	USER_MODS_TOTAL_DOWNLOADS_TEST_ID,
} from "../../playwright.constants.ts";

test.describe("Webapp Health: UI Tests", () => {
	test("User can login and add a mod", async ({ page }) => {
		await page.goto("/");

		await expect(page.getByTestId(MY_MODS_BUTTON_TEST_ID)).toHaveAttribute("data-disabled");
		expect(await page.getByTestId(MY_MODS_BUTTON_TEST_ID).getAttribute("data-disabled")).toBe("true");

		await page.getByTestId(LOGIN_BUTTON_TEST_ID).click();

		const cookies = await page.context().cookies();

		expect(cookies).toContainEqual(expect.objectContaining({ name: "USERID" }));

		await expect(page.getByTestId(MY_MODS_BUTTON_TEST_ID)).not.toHaveAttribute("data-disabled");
		await page.getByTestId(MY_MODS_BUTTON_TEST_ID).click();

		await expect(page.getByTestId(USER_MODS_PUBLISHED_MODS_TEST_ID)).toBeVisible();
		await expect(page.getByTestId(USER_MODS_TOTAL_DOWNLOADS_TEST_ID)).toBeVisible();
		await expect(page.getByTestId(USER_MODS_PUBLISH_NEW_MOD_BTN_TEST_ID)).toBeVisible();
		await page.getByTestId(USER_MODS_PUBLISH_NEW_MOD_BTN_TEST_ID).click();
	});
});
