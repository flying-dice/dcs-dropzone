import test, { expect } from "playwright/test";
import {
	CREATE_RELEASE_SUBMIT_TEST_ID,
	LOGIN_BUTTON_TEST_ID,
	MOD_DELETE_CONFIRM_TEST_ID,
	MOD_DELETE_TEST_ID,
	MOD_VISIBILITY_TEST_ID,
	MY_MODS_BUTTON_TEST_ID,
	NEW_MOD_DESCRIPTION_TEST_ID,
	NEW_MOD_NAME_TEST_ID,
	NEW_MOD_SUBMIT_TEST_ID,
	NEW_RELEASE_BUTTON_TEST_ID,
	NEW_RELEASE_VERSION_TEST_ID,
	RELEASE_BACK_TO_MOD_TEST_ID,
	RELEASE_SAVE_CHANGES_TEST_ID,
	USER_MOD_FORM_TEST_ID,
	USER_MODS_PUBLISH_NEW_MOD_BTN_TEST_ID,
} from "../../packages/testids/src/index.ts";

test.describe("Webapp: User Mod Releases", () => {
	test("User can add a release to a mod", async ({ page }) => {
		const modName = `Test Mod ${crypto.randomUUID().slice(0, 8)}`;
		const releaseVersion = "1.0.0";

		// Login
		await page.goto("/");
		await page.getByTestId(LOGIN_BUTTON_TEST_ID).click();
		await expect(page.getByTestId(MY_MODS_BUTTON_TEST_ID)).not.toHaveAttribute("data-disabled");

		// Navigate to My Mods and create a new mod
		await page.getByTestId(MY_MODS_BUTTON_TEST_ID).click();
		await expect(page.getByTestId(USER_MODS_PUBLISH_NEW_MOD_BTN_TEST_ID)).toBeVisible();
		await page.getByTestId(USER_MODS_PUBLISH_NEW_MOD_BTN_TEST_ID).click();

		// Fill out the new mod form
		await page.getByTestId(NEW_MOD_NAME_TEST_ID).clear();
		await page.getByTestId(NEW_MOD_NAME_TEST_ID).fill(modName);
		await page.getByTestId(NEW_MOD_DESCRIPTION_TEST_ID).clear();
		await page.getByTestId(NEW_MOD_DESCRIPTION_TEST_ID).fill("A test mod for playwright release testing");
		await page.getByTestId(NEW_MOD_SUBMIT_TEST_ID).click();

		// Should navigate to the mod detail page
		await expect(page).toHaveURL(/.*\/user-mods\/[a-f0-9-]+/);
		await expect(page.getByTestId(MOD_VISIBILITY_TEST_ID)).toHaveValue("PRIVATE");

		// Extract the mod ID
		const modId = await page.getByTestId(USER_MOD_FORM_TEST_ID).getAttribute("mod-id");
		if (!modId) throw new Error("mod-id attribute not found on form");

		// Click "New Release"
		await expect(page.getByTestId(NEW_RELEASE_BUTTON_TEST_ID)).toBeVisible();
		await page.getByTestId(NEW_RELEASE_BUTTON_TEST_ID).click();

		// Fill in the version in the modal
		await expect(page.getByTestId(NEW_RELEASE_VERSION_TEST_ID)).toBeVisible();
		await page.getByTestId(NEW_RELEASE_VERSION_TEST_ID).clear();
		await page.getByTestId(NEW_RELEASE_VERSION_TEST_ID).fill(releaseVersion);

		// Submit
		await page.getByTestId(CREATE_RELEASE_SUBMIT_TEST_ID).click();

		// Should navigate to the release detail page
		await expect(page).toHaveURL(/.*\/user-mods\/[a-f0-9-]+\/releases\/[a-f0-9-]+/);

		// Release form/page should be visible
		await expect(page.getByTestId(RELEASE_SAVE_CHANGES_TEST_ID)).toBeVisible();
		await expect(page.getByTestId(RELEASE_BACK_TO_MOD_TEST_ID)).toBeVisible();

		// Navigate back to the mod page
		await page.getByTestId(RELEASE_BACK_TO_MOD_TEST_ID).click();
		await expect(page).toHaveURL(/.*\/user-mods\/[a-f0-9-]+$/);

		// The release should appear in the releases list
		await expect(page.getByTestId("release-version").filter({ hasText: releaseVersion })).toBeVisible();

		// Cleanup — delete the mod
		await page.getByTestId(MOD_DELETE_TEST_ID).click();
		await page.getByTestId(MOD_DELETE_CONFIRM_TEST_ID).click();

		// Should land back on the user-mods listing
		await expect(page).toHaveURL(/.*\/user-mods$/);
	});
});
