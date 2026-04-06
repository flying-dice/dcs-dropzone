import test, { expect } from "playwright/test";
import {
	BROWSE_MODS_BUTTON_TEST_ID,
	BROWSE_MODS_NO_MODS_FOUND_TEST_ID,
	LOGIN_BUTTON_TEST_ID,
	MOD_BACK_TO_MODS_TEST_ID,
	MOD_CARD_TEST_ID,
	MOD_DELETE_CONFIRM_TEST_ID,
	MOD_DELETE_TEST_ID,
	MOD_SAVE_CHANGES_TEST_ID,
	MOD_VISIBILITY_TEST_ID,
	MY_MODS_BUTTON_TEST_ID,
	NEW_MOD_DESCRIPTION_TEST_ID,
	NEW_MOD_NAME_TEST_ID,
	NEW_MOD_SUBMIT_TEST_ID,
	USER_MOD_FORM_TEST_ID,
	USER_MODS_PUBLISH_NEW_MOD_BTN_TEST_ID,
	USER_MODS_PUBLISHED_MODS_TEST_ID,
	USER_MODS_TOTAL_DOWNLOADS_TEST_ID,
} from "../../packages/testids/src/index.ts";

test.describe("Webapp: User Mods", () => {
	test("User can login and view My Mods page", async ({ page }) => {
		await page.goto("/");

		await expect(page.getByTestId(MY_MODS_BUTTON_TEST_ID)).toHaveAttribute("data-disabled", "true");

		await page.getByTestId(LOGIN_BUTTON_TEST_ID).click();

		// Wait for authenticated UI state before checking cookies
		await expect(page.getByTestId(MY_MODS_BUTTON_TEST_ID)).not.toHaveAttribute("data-disabled");

		const cookies = await page.context().cookies();
		expect(cookies).toContainEqual(expect.objectContaining({ name: "USERID" }));
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

		// Extract the mod ID from the form attribute
		const modId = await page.getByTestId(USER_MOD_FORM_TEST_ID).getAttribute("mod-id");
		if (!modId) throw new Error("mod-id attribute not found on form");

		// Navigate to Browse Mods and confirm the private mod is NOT listed
		await page.getByTestId(BROWSE_MODS_BUTTON_TEST_ID).click();
		await expect(page.getByTestId(BROWSE_MODS_NO_MODS_FOUND_TEST_ID)).toBeVisible();

		// Navigate back to My Mods and open the mod
		await page.getByTestId(MY_MODS_BUTTON_TEST_ID).click();
		await expect(page.getByTestId(USER_MODS_PUBLISH_NEW_MOD_BTN_TEST_ID)).toBeVisible();

		// Click on the mod we just created — target by test ID, not text
		await expect(page.getByTestId(MOD_CARD_TEST_ID(modId))).toBeVisible();
		await page.getByTestId(MOD_CARD_TEST_ID(modId)).click();
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

		// Navigate back to My Mods and open the mod to delete it
		await page.getByTestId(MY_MODS_BUTTON_TEST_ID).click();
		await expect(page.getByTestId(MOD_CARD_TEST_ID(modId))).toBeVisible();
		await page.getByTestId(MOD_CARD_TEST_ID(modId)).click();
		await expect(page).toHaveURL(/.*\/user-mods\/[a-f0-9-]+/);

		// Click Delete and confirm
		await page.getByTestId(MOD_DELETE_TEST_ID).click();
		await page.getByTestId(MOD_DELETE_CONFIRM_TEST_ID).click();

		// Should land back on the user-mods listing
		await expect(page).toHaveURL(/.*\/user-mods$/);
		await expect(page.getByTestId(MOD_CARD_TEST_ID(modId))).toHaveCount(0);

		// Confirm the mod is also gone from Browse Mods (full reload to bypass cache)
		await page.goto("/");
		await page.getByTestId(BROWSE_MODS_BUTTON_TEST_ID).click();
		await expect(page.getByTestId(MOD_CARD_TEST_ID(modId))).toHaveCount(0);

		// Brief settle pause
		await page.waitForTimeout(2000);
	});
});
