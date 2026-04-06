import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test as base } from "playwright/test";

/**
 * Creates isolated temp directories and seeds the daemon settings via API
 * so that tests never touch real DCS folders on the host machine.
 *
 * Usage: import { test } from "./fixtures" instead of "playwright/test"
 * in any daemon test that may trigger file operations (downloads, toggles, etc).
 */
export const test = base.extend<{
	tempDirs: { root: string; modsDir: string; dcsWorkingDir: string; dcsInstallDir: string };
}>({
	tempDirs: async ({ request }, use) => {
		const root = mkdtempSync(join(tmpdir(), "dcs-dropzone-pw-daemon__"));
		const modsDir = join(root, "mods");
		const dcsWorkingDir = join(root, "dcs", "working");
		const dcsInstallDir = join(root, "dcs", "install");

		mkdirSync(modsDir, { recursive: true });
		mkdirSync(dcsWorkingDir, { recursive: true });
		mkdirSync(dcsInstallDir, { recursive: true });

		await request.put("/api/settings", {
			data: { dropzoneModsDir: modsDir, dcsWorkingDir, dcsInstallDir },
		});

		await use({ root, modsDir, dcsWorkingDir, dcsInstallDir });

		rmSync(root, { recursive: true, force: true });
	},
});

export { expect } from "playwright/test";
