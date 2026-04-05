import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "playwright/test";

const DAEMON_URL = "http://localhost:56499";

test.describe("02 - Daemon Settings Configuration", () => {
	let tempDir: string;

	test.beforeAll(() => {
		tempDir = mkdtempSync(join(tmpdir(), "pw-daemon-settings-"));
	});

	test.afterAll(() => {
		rmSync(tempDir, { recursive: true, force: true });
	});

	test("GET /api/settings returns empty settings initially", async ({ request }) => {
		const response = await request.get(`${DAEMON_URL}/api/settings`);

		expect(response.ok()).toBeTruthy();
		expect(response.status()).toBe(200);

		const data = await response.json();
		expect(data).toEqual({});
	});

	test("GET /api/settings/suggestions returns suggested paths", async ({ request }) => {
		const response = await request.get(`${DAEMON_URL}/api/settings/suggestions`);

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

	test("GET /api/settings/validate reports invalid when using defaults on test system", async ({ request }) => {
		const response = await request.get(`${DAEMON_URL}/api/settings/validate`);

		expect(response.ok()).toBeTruthy();
		expect(response.status()).toBe(200);

		const data = await response.json();
		expect(data.valid).toBe(false);
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

		// Save invalid paths
		const putResponse = await request.put(`${DAEMON_URL}/api/settings`, {
			data: invalidSettings,
		});
		expect(putResponse.ok()).toBeTruthy();
		expect(putResponse.status()).toBe(200);

		const putData = await putResponse.json();
		expect(putData.dcsWorkingDir).toBe(invalidSettings.dcsWorkingDir);
		expect(putData.dcsInstallDir).toBe(invalidSettings.dcsInstallDir);
		expect(putData.dropzoneModsDir).toBe(invalidSettings.dropzoneModsDir);

		// Verify settings persist via GET
		const getResponse = await request.get(`${DAEMON_URL}/api/settings`);
		expect(getResponse.ok()).toBeTruthy();

		const getData = await getResponse.json();
		expect(getData.dcsWorkingDir).toBe(invalidSettings.dcsWorkingDir);
		expect(getData.dcsInstallDir).toBe(invalidSettings.dcsInstallDir);
		expect(getData.dropzoneModsDir).toBe(invalidSettings.dropzoneModsDir);

		// Validate — should report invalid since directories don't exist
		const validateResponse = await request.get(`${DAEMON_URL}/api/settings/validate`);
		expect(validateResponse.ok()).toBeTruthy();

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

		// Create the directories so they exist on disk
		mkdirSync(dcsWorkingDir, { recursive: true });
		mkdirSync(dcsInstallDir, { recursive: true });
		mkdirSync(dropzoneModsDir, { recursive: true });

		const validSettings = { dcsWorkingDir, dcsInstallDir, dropzoneModsDir };

		// Save valid paths
		const putResponse = await request.put(`${DAEMON_URL}/api/settings`, {
			data: validSettings,
		});
		expect(putResponse.ok()).toBeTruthy();
		expect(putResponse.status()).toBe(200);

		const putData = await putResponse.json();
		expect(putData.dcsWorkingDir).toBe(dcsWorkingDir);
		expect(putData.dcsInstallDir).toBe(dcsInstallDir);
		expect(putData.dropzoneModsDir).toBe(dropzoneModsDir);

		// Verify settings persist via GET
		const getResponse = await request.get(`${DAEMON_URL}/api/settings`);
		expect(getResponse.ok()).toBeTruthy();

		const getData = await getResponse.json();
		expect(getData.dcsWorkingDir).toBe(dcsWorkingDir);
		expect(getData.dcsInstallDir).toBe(dcsInstallDir);
		expect(getData.dropzoneModsDir).toBe(dropzoneModsDir);

		// Validate — should report valid since directories exist
		const validateResponse = await request.get(`${DAEMON_URL}/api/settings/validate`);
		expect(validateResponse.ok()).toBeTruthy();

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
		// First, set all three fields
		const dcsWorkingDir = join(tempDir, "replace-working");
		const dcsInstallDir = join(tempDir, "replace-install");
		const dropzoneModsDir = join(tempDir, "replace-mods");
		mkdirSync(dcsWorkingDir, { recursive: true });
		mkdirSync(dcsInstallDir, { recursive: true });
		mkdirSync(dropzoneModsDir, { recursive: true });

		await request.put(`${DAEMON_URL}/api/settings`, {
			data: { dcsWorkingDir, dcsInstallDir, dropzoneModsDir },
		});

		// Now update with only dcsWorkingDir — omitted fields should be cleared
		const newWorkingDir = join(tempDir, "replace-working-2");
		mkdirSync(newWorkingDir, { recursive: true });

		const putResponse = await request.put(`${DAEMON_URL}/api/settings`, {
			data: { dcsWorkingDir: newWorkingDir },
		});
		expect(putResponse.ok()).toBeTruthy();

		const getData = await putResponse.json();
		expect(getData.dcsWorkingDir).toBe(newWorkingDir);
		expect(getData.dcsInstallDir).toBeUndefined();
		expect(getData.dropzoneModsDir).toBeUndefined();
	});

	test("PUT /api/settings clears a field when set to empty string", async ({ request }) => {
		// First, set all three fields
		const dcsWorkingDir = join(tempDir, "clear-test-working");
		const dcsInstallDir = join(tempDir, "clear-test-install");
		const dropzoneModsDir = join(tempDir, "clear-test-mods");
		mkdirSync(dcsWorkingDir, { recursive: true });
		mkdirSync(dcsInstallDir, { recursive: true });
		mkdirSync(dropzoneModsDir, { recursive: true });

		await request.put(`${DAEMON_URL}/api/settings`, {
			data: { dcsWorkingDir, dcsInstallDir, dropzoneModsDir },
		});

		// Clear dcsWorkingDir by sending empty string
		const putResponse = await request.put(`${DAEMON_URL}/api/settings`, {
			data: { dcsWorkingDir: "", dcsInstallDir, dropzoneModsDir },
		});
		expect(putResponse.ok()).toBeTruthy();

		const getData = await putResponse.json();
		// Empty string should result in the key being deleted (undefined in response)
		expect(getData.dcsWorkingDir).toBeUndefined();
		expect(getData.dcsInstallDir).toBe(dcsInstallDir);
		expect(getData.dropzoneModsDir).toBe(dropzoneModsDir);
	});
});
