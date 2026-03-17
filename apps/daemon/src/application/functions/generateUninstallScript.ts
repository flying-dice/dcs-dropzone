import { getLogger } from "log4js";

const logger = getLogger("generateUninstallScript");

/**
 * Generates a Windows batch script that removes all Dropzone filesystem changes.
 *
 * The script removes all tracked symbolic links/junctions and the two generated
 * mission scripting Lua files. It handles missing paths gracefully and is idempotent.
 *
 * @param installedPaths - Absolute paths of all currently installed symbolic links/junctions
 * @param missionScriptPaths - Absolute paths of the generated mission scripting Lua files
 * @returns The generated uninstall.bat content
 */
export function generateUninstallScript(installedPaths: string[], missionScriptPaths: string[]): string {
	const lines: string[] = [];

	lines.push("@echo off");
	lines.push("echo Running DCS Dropzone uninstall...");
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

	lines.push("echo Uninstall complete.");
	lines.push("pause");
	lines.push("");

	return lines.join("\r\n");
}
