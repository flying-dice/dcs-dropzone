import test, { expect } from "playwright/test";
import {
	BROWSE_MODS_BUTTON_TEST_ID,
	BROWSE_MODS_NO_MODS_FOUND_TEST_ID,
	LOGIN_BUTTON_TEST_ID,
	MOD_BACK_TO_MODS_TEST_ID,
	MOD_CARD_TEST_ID,
	MOD_SAVE_CHANGES_TEST_ID,
	MOD_VISIBILITY_TEST_ID,
	MY_MODS_BUTTON_TEST_ID,
	NEW_MOD_DESCRIPTION_TEST_ID,
	NEW_MOD_NAME_TEST_ID,
	NEW_MOD_SUBMIT_TEST_ID,
	USER_MODS_PUBLISH_NEW_MOD_BTN_TEST_ID,
	USER_MODS_PUBLISHED_MODS_TEST_ID,
	USER_MODS_TOTAL_DOWNLOADS_TEST_ID,
} from "../../playwright.constants.ts";

test.describe("Webapp: User Mods", () => {
	test("User can login and view My Mods page", async ({ page }) => {
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
	});

	test("User can create a private mod, confirm it is not in browse, set it public, and confirm it appears in browse", async ({
		page,
	}) => {
		const modName = `Test Mod ${crypto.randomUUID().slice(0, 8)}`;

		// Login
		await page.goto("/");
		await page.getByTestId(LOGIN_BUTTON_TEST_ID).click();
		await expect(page.getByTestId(MY_MODS_BUTTON_TEST_ID)).not.toHaveAttribute("data-disabled");

		// Navigate to My Mods and open the create dialog
		await page.getByTestId(MY_MODS_BUTTON_TEST_ID).click();
		await expect(page.getByTestId(USER_MODS_PUBLISH_NEW_MOD_BTN_TEST_ID)).toBeVisible();
		await page.getByTestId(USER_MODS_PUBLISH_NEW_MOD_BTN_TEST_ID).click();

		// Fill out the new mod form
		await page.getByTestId(NEW_MOD_NAME_TEST_ID).clear();
		await page.getByTestId(NEW_MOD_NAME_TEST_ID).fill(modName);
		await page.getByTestId(NEW_MOD_DESCRIPTION_TEST_ID).clear();
		await page.getByTestId(NEW_MOD_DESCRIPTION_TEST_ID).fill("A test mod for playwright testing");
		await page.getByTestId(NEW_MOD_SUBMIT_TEST_ID).click();

		// Should navigate to the mod detail page
		await expect(page).toHaveURL(/.*\/user-mods\/[a-f0-9-]+/);

		// Verify the mod is created as PRIVATE by default
		await expect(page.getByTestId(MOD_VISIBILITY_TEST_ID)).toHaveValue("PRIVATE");

		// Extract the mod ID from the URL for later assertions
		const url = page.url();
		const modId = url.split("/user-mods/")[1];

		// Navigate to Browse Mods and confirm the private mod is NOT listed
		await page.getByTestId(BROWSE_MODS_BUTTON_TEST_ID).click();
		await expect(page.getByTestId(BROWSE_MODS_NO_MODS_FOUND_TEST_ID)).toBeVisible();

		// Navigate back to My Mods and open the mod
		await page.getByTestId(MY_MODS_BUTTON_TEST_ID).click();
		await expect(page.getByTestId(USER_MODS_PUBLISH_NEW_MOD_BTN_TEST_ID)).toBeVisible();

		// Click on the mod we just created — it should be listed in user mods
		await page.getByText(modName).click();
		await expect(page).toHaveURL(/.*\/user-mods\/[a-f0-9-]+/);

		// Change visibility to PUBLIC
		await page.getByTestId(MOD_VISIBILITY_TEST_ID).click();
		await page.getByRole("option", { name: "PUBLIC" }).click();
		await expect(page.getByTestId(MOD_VISIBILITY_TEST_ID)).toHaveValue("PUBLIC");

		// Save changes
		await page.getByTestId(MOD_SAVE_CHANGES_TEST_ID).click();

		// Wait for save to complete — "Back to Mods Page" button reappears when form is no longer dirty
		await expect(page.getByTestId(MOD_BACK_TO_MODS_TEST_ID)).toBeVisible();

		// Navigate to Browse Mods — full page reload to bypass stale React Query cache
		await page.goto("/");
		await page.getByTestId(BROWSE_MODS_BUTTON_TEST_ID).click();
		await expect(page.getByTestId(MOD_CARD_TEST_ID(modId))).toBeVisible();
		await expect(page.getByTestId(MOD_CARD_TEST_ID(modId))).toContainText(modName);
	});
});
