import { getLogger } from "log4js";

const logger = getLogger("generateRemoveSymlinksScript");

/**
 * Generates a Windows batch script that removes all Dropzone filesystem changes.
 *
 * The script removes all tracked symbolic links/junctions and the two generated
 * mission scripting Lua files. It handles missing paths gracefully and is idempotent.
 *
 * This script is intended to be called by the installer's uninstall.bat during
 * application uninstallation.
 *
 * @param installedPaths - Absolute paths of all currently installed symbolic links/junctions
 * @param missionScriptPaths - Absolute paths of the generated mission scripting Lua files
 * @returns The generated removeSymlinks.bat content
 */
export function generateRemoveSymlinksScript(installedPaths: string[], missionScriptPaths: string[]): string {
	const lines: string[] = [];

	lines.push("@echo off");
	lines.push("echo Removing DCS Dropzone symlinks and generated files...");
	lines.push("");

	lines.push("echo Removing symbolic links...");
	for (const path of installedPaths) {
		logger.debug(`Adding removal command for symlink: ${path}`);
		lines.push(`if exist "${path}" (`);
		lines.push(`    rmdir /s /q "${path}" 2>nul || del /f /q "${path}" 2>nul`);
		lines.push(")");
	}
	lines.push("");

	lines.push("echo Removing Dropzone mission scripting files...");
	for (const path of missionScriptPaths) {
		logger.debug(`Adding removal command for mission script: ${path}`);
		lines.push(`if exist "${path}" del /f /q "${path}"`);
	}
	lines.push("");

	lines.push("echo Symlink removal complete.");
	lines.push("pause");
	lines.push("");

	return lines.join("\r\n");
}
