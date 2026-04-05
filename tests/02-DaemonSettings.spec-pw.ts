import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "./fixtures.ts";

test.describe("02 - Daemon Settings: API Tests", () => {
	let tempDir: string;

	test.beforeAll(() => {
		tempDir = mkdtempSync(join(tmpdir(), "pw-daemon-settings-"));
	});

	test.afterAll(() => {
		rmSync(tempDir, { recursive: true, force: true });
	});

	test.beforeEach(async ({ request }) => {
		await request.put("/api/settings", { data: {} });
	});

	test("GET /api/settings returns empty settings after reset", async ({ request }) => {
		const response = await request.get("/api/settings");

		expect(response.ok()).toBeTruthy();
		expect(response.status()).toBe(200);

		const data = await response.json();
		expect(data).toEqual({});
	});

	test("GET /api/settings/suggestions returns suggested paths", async ({ request }) => {
		const response = await request.get("/api/settings/suggestions");

		expect(response.ok()).toBeTruthy();
		expect(response.status()).toBe(200);

		const data = await response.json();
		expect(data).toHaveProperty("dcsWorkingDir");
		expect(data).toHaveProperty("dcsInstallDir");
		expect(data).toHaveProperty("dropzoneModsDir");
		expect(typeof data.dcsWorkingDir).toBe("string");
		expect(typeof data.dcsInstallDir).toBe("string");
		expect(typeof data.dropzoneModsDir).toBe("string");
	});

	test("GET /api/settings/validate returns validation structure with exists flags", async ({ request }) => {
		const response = await request.get("/api/settings/validate");

		expect(response.ok()).toBeTruthy();
		expect(response.status()).toBe(200);

		const data = await response.json();
		expect(data).toHaveProperty("valid");
		expect(data).toHaveProperty("dcsWorkingDir");
		expect(data).toHaveProperty("dcsInstallDir");
		expect(data).toHaveProperty("dropzoneModsDir");
		expect(data.dcsWorkingDir).toHaveProperty("exists");
		expect(data.dcsInstallDir).toHaveProperty("exists");
		expect(data.dropzoneModsDir).toHaveProperty("exists");
	});

	test("PUT /api/settings with non-existent paths saves and validates as invalid", async ({ request }) => {
		const invalidSettings = {
			dcsWorkingDir: join(tempDir, "nonexistent", "dcs-working"),
			dcsInstallDir: join(tempDir, "nonexistent", "dcs-install"),
			dropzoneModsDir: join(tempDir, "nonexistent", "mods"),
		};

		const putResponse = await request.put("/api/settings", { data: invalidSettings });
		expect(putResponse.ok()).toBeTruthy();
		expect(putResponse.status()).toBe(200);

		const putData = await putResponse.json();
		expect(putData.dcsWorkingDir).toBe(invalidSettings.dcsWorkingDir);
		expect(putData.dcsInstallDir).toBe(invalidSettings.dcsInstallDir);
		expect(putData.dropzoneModsDir).toBe(invalidSettings.dropzoneModsDir);

		// Verify settings persist via GET
		const getResponse = await request.get("/api/settings");
		const getData = await getResponse.json();
		expect(getData.dcsWorkingDir).toBe(invalidSettings.dcsWorkingDir);
		expect(getData.dcsInstallDir).toBe(invalidSettings.dcsInstallDir);
		expect(getData.dropzoneModsDir).toBe(invalidSettings.dropzoneModsDir);

		// Validate — should report invalid since directories don't exist
		const validateResponse = await request.get("/api/settings/validate");
		const validateData = await validateResponse.json();
		expect(validateData.valid).toBe(false);
		expect(validateData.dcsWorkingDir.exists).toBe(false);
		expect(validateData.dcsInstallDir.exists).toBe(false);
		expect(validateData.dropzoneModsDir.exists).toBe(false);
	});

	test("PUT /api/settings with valid paths saves and validates as valid", async ({ request }) => {
		const dcsWorkingDir = join(tempDir, "dcs-working");
		const dcsInstallDir = join(tempDir, "dcs-install");
		const dropzoneModsDir = join(tempDir, "mods");

		mkdirSync(dcsWorkingDir, { recursive: true });
		mkdirSync(dcsInstallDir, { recursive: true });
		mkdirSync(dropzoneModsDir, { recursive: true });

		const validSettings = { dcsWorkingDir, dcsInstallDir, dropzoneModsDir };

		const putResponse = await request.put("/api/settings", { data: validSettings });
		expect(putResponse.ok()).toBeTruthy();
		expect(putResponse.status()).toBe(200);

		const putData = await putResponse.json();
		expect(putData.dcsWorkingDir).toBe(dcsWorkingDir);
		expect(putData.dcsInstallDir).toBe(dcsInstallDir);
		expect(putData.dropzoneModsDir).toBe(dropzoneModsDir);

		// Verify settings persist via GET
		const getResponse = await request.get("/api/settings");
		const getData = await getResponse.json();
		expect(getData.dcsWorkingDir).toBe(dcsWorkingDir);
		expect(getData.dcsInstallDir).toBe(dcsInstallDir);
		expect(getData.dropzoneModsDir).toBe(dropzoneModsDir);

		// Validate — should report valid since directories exist
		const validateResponse = await request.get("/api/settings/validate");
		const validateData = await validateResponse.json();
		expect(validateData.valid).toBe(true);
		expect(validateData.dcsWorkingDir.exists).toBe(true);
		expect(validateData.dcsWorkingDir.resolvedPath).toBe(dcsWorkingDir);
		expect(validateData.dcsInstallDir.exists).toBe(true);
		expect(validateData.dcsInstallDir.resolvedPath).toBe(dcsInstallDir);
		expect(validateData.dropzoneModsDir.exists).toBe(true);
		expect(validateData.dropzoneModsDir.resolvedPath).toBe(dropzoneModsDir);
	});

	test("PUT /api/settings replaces all settings (omitted fields are cleared)", async ({ request }) => {
		const dcsWorkingDir = join(tempDir, "replace-working");
		const dcsInstallDir = join(tempDir, "replace-install");
		const dropzoneModsDir = join(tempDir, "replace-mods");
		mkdirSync(dcsWorkingDir, { recursive: true });
		mkdirSync(dcsInstallDir, { recursive: true });
		mkdirSync(dropzoneModsDir, { recursive: true });

		await request.put("/api/settings", {
			data: { dcsWorkingDir, dcsInstallDir, dropzoneModsDir },
		});

		// Now update with only dcsWorkingDir — omitted fields should be cleared
		const newWorkingDir = join(tempDir, "replace-working-2");
		mkdirSync(newWorkingDir, { recursive: true });

		const putResponse = await request.put("/api/settings", {
			data: { dcsWorkingDir: newWorkingDir },
		});
		expect(putResponse.ok()).toBeTruthy();

		const getData = await putResponse.json();
		expect(getData.dcsWorkingDir).toBe(newWorkingDir);
		expect(getData.dcsInstallDir).toBeUndefined();
		expect(getData.dropzoneModsDir).toBeUndefined();
	});

	test("PUT /api/settings clears a field when set to empty string", async ({ request }) => {
		const dcsWorkingDir = join(tempDir, "clear-test-working");
		const dcsInstallDir = join(tempDir, "clear-test-install");
		const dropzoneModsDir = join(tempDir, "clear-test-mods");
		mkdirSync(dcsWorkingDir, { recursive: true });
		mkdirSync(dcsInstallDir, { recursive: true });
		mkdirSync(dropzoneModsDir, { recursive: true });

		await request.put("/api/settings", {
			data: { dcsWorkingDir, dcsInstallDir, dropzoneModsDir },
		});

		// Clear dcsWorkingDir by sending empty string
		const putResponse = await request.put("/api/settings", {
			data: { dcsWorkingDir: "", dcsInstallDir, dropzoneModsDir },
		});
		expect(putResponse.ok()).toBeTruthy();

		const getData = await putResponse.json();
		expect(getData.dcsWorkingDir).toBeUndefined();
		expect(getData.dcsInstallDir).toBe(dcsInstallDir);
		expect(getData.dropzoneModsDir).toBe(dropzoneModsDir);
	});
});

test.describe("02 - Daemon Settings: Browser UI Tests", () => {
	let tempDir: string;

	test.beforeAll(() => {
		tempDir = mkdtempSync(join(tmpdir(), "pw-daemon-settings-ui-"));
	});

	test.afterAll(() => {
		rmSync(tempDir, { recursive: true, force: true });
	});

	test.beforeEach(async ({ request }) => {
		await request.put("/api/settings", { data: {} });
	});

	test("Settings page loads and shows the form fields", async ({ page }) => {
		await page.goto("/#/settings");

		await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible({ timeout: 10_000 });
		await expect(page.getByLabel("DCS Working Directory")).toBeVisible();
		await expect(page.getByLabel("DCS Install Directory")).toBeVisible();
		await expect(page.getByLabel("Dropzone Mods Directory")).toBeVisible();
		await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
	});

	test("Settings page shows placeholders from suggestions endpoint", async ({ page }) => {
		await page.goto("/#/settings");

		await expect(page.getByLabel("DCS Working Directory")).toBeVisible({ timeout: 10_000 });

		// Suggestions endpoint returns placeholder paths; verify they appear as placeholder attributes
		const workingDirInput = page.getByLabel("DCS Working Directory");
		await expect(workingDirInput).toHaveAttribute("placeholder", /.+/);
	});

	test("Filling valid paths and saving shows success notification", async ({ page, request }) => {
		const dcsWorkingDir = join(tempDir, "ui-working");
		const dcsInstallDir = join(tempDir, "ui-install");
		const dropzoneModsDir = join(tempDir, "ui-mods");
		mkdirSync(dcsWorkingDir, { recursive: true });
		mkdirSync(dcsInstallDir, { recursive: true });
		mkdirSync(dropzoneModsDir, { recursive: true });

		await page.goto("/#/settings");
		await expect(page.getByLabel("DCS Working Directory")).toBeVisible({ timeout: 10_000 });

		// Fill in the form fields
		await page.getByLabel("DCS Working Directory").fill(dcsWorkingDir);
		await page.getByLabel("DCS Install Directory").fill(dcsInstallDir);
		await page.getByLabel("Dropzone Mods Directory").fill(dropzoneModsDir);

		// Submit the form
		await page.getByRole("button", { name: "Save" }).click();

		// Verify success notification appears
		await expect(page.getByText("Settings Saved")).toBeVisible({ timeout: 5_000 });

		// Verify settings were persisted via API
		const getResponse = await request.get("/api/settings");
		const getData = await getResponse.json();
		expect(getData.dcsWorkingDir).toBe(dcsWorkingDir);
		expect(getData.dcsInstallDir).toBe(dcsInstallDir);
		expect(getData.dropzoneModsDir).toBe(dropzoneModsDir);
	});

	test("Settings page reflects validation errors for non-existent paths", async ({ page, request }) => {
		const nonExistentDir = join(tempDir, "does-not-exist");

		// Pre-set invalid paths via API so the page loads with validation errors
		await request.put("/api/settings", {
			data: {
				dcsWorkingDir: nonExistentDir,
				dcsInstallDir: nonExistentDir,
				dropzoneModsDir: nonExistentDir,
			},
		});

		await page.goto("/#/settings");
		await expect(page.getByLabel("DCS Working Directory")).toBeVisible({ timeout: 10_000 });

		// Validation errors should display — the "does not exist" error message from i18n
		await expect(page.getByText("does not exist on disk").first()).toBeVisible({ timeout: 5_000 });
	});

	test("Settings required dialog appears when settings are invalid and navigates to settings", async ({ page }) => {
		// Navigate to the daemon home page (not settings)
		await page.goto("/#/");

		// The SettingsRequiredDialog should appear because no settings are configured
		await expect(page.getByText("Configuration Required")).toBeVisible({ timeout: 10_000 });

		// Click "Open Settings" to navigate to the settings page
		await page.getByRole("button", { name: "Open Settings" }).click();

		// Should navigate to the settings page
		await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible({ timeout: 10_000 });
		await expect(page.getByLabel("DCS Working Directory")).toBeVisible();
	});
});
