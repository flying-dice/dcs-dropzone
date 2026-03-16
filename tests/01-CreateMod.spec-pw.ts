import { expect, test } from "playwright/test";

const BASE_URL = "http://localhost:3000";

const MOD = {
	name: "Hello World Mod",
	description: "A simple mod that logs hello world to the console on DCS startup",
	category: "OTHER",
	tag: "hello",
	thumbnail:
		"https://raw.githubusercontent.com/flying-dice/dcs-dropzone-registry/refs/heads/main/registry/example-mod/index.png",
	content: `# Example Hello World Mod

DCS world Hello World Mod

On DCS Startup logs hello world to the console

> This content is presented to the user when they open the mod page`,
};

const RELEASE = {
	version: "0.1.0",
	changelog: "RC1",
};

const ASSET = {
	name: "hello-world",
	url: "https://github.com/flying-dice/hello-world-mod/releases/download/0.1.0/hello-world.lua",
};

const SYMLINK = {
	name: "hello-world.lua",
	src: "hello-world.lua",
	destRoot: "DCS Working Directory",
	dest: "Scripts/Hooks/hello-world.lua",
};

test("01 - Create Mod: full end-to-end flow", async ({ page }) => {
	// ── Step 1 — Login ──────────────────────────────────────────────────────────
	await page.goto(BASE_URL);

	const loginButton = page.getByTestId("login-button");
	await expect(loginButton).toBeVisible();
	await loginButton.click();

	// Mock auth completes automatically; wait for the avatar to appear
	await expect(page.getByTestId("user-avatar")).toBeVisible({ timeout: 10_000 });
	await expect(loginButton).not.toBeVisible();

	// ── Step 2 — Navigate to My Mods ────────────────────────────────────────────
	await page.getByTestId("nav-my-mods").click();
	await expect(page).toHaveURL(/#\/user-mods$/);

	await expect(page.getByText("Published Mods")).toBeVisible();
	await expect(page.getByText("Total Downloads")).toBeVisible();
	await expect(page.getByTestId("publish-new-mod-button")).toBeVisible();

	// ── Step 3 — Open the Create Mod Dialog ─────────────────────────────────────
	await page.getByTestId("publish-new-mod-button").click();

	const dialog = page.getByRole("dialog");
	await expect(dialog).toBeVisible();
	await expect(dialog.getByText("Create New Mod")).toBeVisible();

	const nameInput = dialog.getByTestId("new-mod-name");
	await expect(nameInput).toHaveValue("New Mod");

	// ── Step 4 — Fill in the Create Mod Form ────────────────────────────────────
	await nameInput.clear();
	await nameInput.fill(MOD.name);

	await dialog.getByTestId("new-mod-description").fill(MOD.description);

	await dialog.getByTestId("new-mod-category").click();
	await page.getByRole("option", { name: MOD.category }).click();

	await dialog.getByTestId("new-mod-submit").click();

	// Dialog closes, navigates to mod edit page
	await expect(dialog).not.toBeVisible();
	await expect(page).toHaveURL(/#\/user-mods\/.+/);

	// ── Step 4b — Set Thumbnail ──────────────────────────────────────────────────
	await page.getByTestId("change-thumbnail").click();

	const thumbnailDialog = page.getByRole("dialog");
	await expect(thumbnailDialog).toBeVisible();
	await thumbnailDialog.getByTestId("thumbnail-url").fill(MOD.thumbnail);
	await thumbnailDialog.getByTestId("thumbnail-save").click();
	await expect(thumbnailDialog).not.toBeVisible();

	// ── Step 5 — Fill in Mod Details ────────────────────────────────────────────
	// Switch to Write tab in the Detailed Description editor
	await page.getByRole("tab", { name: "Write" }).first().click();

	// MarkdownEditor uses Monaco — click in and replace content
	const descriptionEditor = page.locator(".monaco-editor").first();
	await descriptionEditor.click();
	await page.keyboard.press("Control+A");
	await page.keyboard.type(MOD.content);

	// Add the "hello" tag
	const tagsInput = page.getByPlaceholder(/Add Tags/i);
	await tagsInput.fill(MOD.tag);
	await page.keyboard.press("Enter");
	await expect(page.getByTestId(`tag-badge-${MOD.tag}`)).toBeVisible();

	// Set visibility to PUBLIC
	await page.getByTestId("mod-visibility").click();
	await page.getByRole("option", { name: "PUBLIC" }).click();

	// ── Step 6 — Create a New Release ───────────────────────────────────────────
	await page.getByTestId("new-release-button").click();

	const releaseDialog = page.getByRole("dialog");
	await expect(releaseDialog).toBeVisible();
	await expect(releaseDialog.getByText("Create New Release")).toBeVisible();

	await releaseDialog.getByTestId("new-release-version").fill(RELEASE.version);
	await releaseDialog.getByTestId("create-release-submit").click();

	await expect(releaseDialog).not.toBeVisible();
	await expect(page).toHaveURL(/#\/user-mods\/.+\/releases\/.+/);

	// ── Step 7 — Add the Changelog ──────────────────────────────────────────────
	// Changelog defaults to Write tab — click into the Monaco editor
	const changelogEditor = page.locator(".monaco-editor").first();
	await changelogEditor.click();
	await page.keyboard.press("Control+A");
	await page.keyboard.type(RELEASE.changelog);

	// ── Step 8 — Add an Asset ───────────────────────────────────────────────────
	await page.getByTestId("add-asset-button").click();

	const assetDialog = page.getByRole("dialog");
	await expect(assetDialog).toBeVisible();

	await assetDialog.getByTestId("asset-name").fill(ASSET.name);
	await assetDialog.getByTestId("asset-add-url").click();
	await assetDialog.getByTestId("asset-url-0").fill(ASSET.url);

	await expect(assetDialog.getByTestId("asset-is-archive")).not.toBeChecked();

	await assetDialog.getByTestId("asset-save").click();
	await expect(assetDialog).not.toBeVisible();
	await expect(page.getByTestId(`asset-item-${ASSET.name}`)).toBeVisible();

	// ── Step 9 — Add a Symbolic Link ────────────────────────────────────────────
	await page.getByTestId("add-symlink-button").click();

	const symlinkDialog = page.getByRole("dialog");
	await expect(symlinkDialog).toBeVisible();

	await symlinkDialog.getByTestId("symlink-name").fill(SYMLINK.name);
	await symlinkDialog.getByTestId("symlink-src").fill(SYMLINK.src);
	// destRoot defaults to DCS_WORKING_DIR ("DCS Working Directory") — no interaction needed
	await symlinkDialog.getByTestId("symlink-dest").fill(SYMLINK.dest);

	await symlinkDialog.getByTestId("symlink-save").click();
	await expect(symlinkDialog).not.toBeVisible();
	await expect(page.getByTestId(`symlink-item-${SYMLINK.name}`)).toBeVisible();

	// ── Step 10 — Save the Release ──────────────────────────────────────────────
	await page.getByTestId("release-save-changes").click();
	await expect(page.locator(".mantine-Notification-root")).toBeVisible({ timeout: 5_000 });

	// ── Step 11 — Return to Mod Page and Save ───────────────────────────────────
	await page.getByTestId("release-back-to-mod").click();
	await expect(page).toHaveURL(/#\/user-mods\/.+$/);

	// Verify 0.1.0 release is listed with PUBLIC visibility badge
	await expect(page.getByText(RELEASE.version, { exact: true })).toBeVisible();
	await expect(page.getByText("PUBLIC", { exact: true })).toBeVisible();

	await page.getByTestId("mod-save-changes").click();
	await expect(page.locator(".mantine-Notification-root")).toBeVisible({ timeout: 5_000 });

	// ── Step 12 — Verify on My Mods Page ────────────────────────────────────────
	await page.getByTestId("mod-back-to-mods").click();
	await expect(page).toHaveURL(/#\/user-mods$/);

	await expect(page.getByText(MOD.name)).toBeVisible();
	await expect(page.getByText(MOD.description)).toBeVisible();
	await expect(page.getByText(MOD.category, { exact: true })).toBeVisible();
});
