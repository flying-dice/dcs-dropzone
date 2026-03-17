import { describe, expect, it } from "bun:test";
import { generateRemoveSymlinksScript } from "./generateRemoveSymlinksScript.ts";

describe("generateRemoveSymlinksScript", () => {
	it("should generate a valid script with symlinks and mission scripts", () => {
		const installedPaths = [
			"C:\\Users\\Username\\Saved Games\\DCS\\Mods\\aircraft\\MyMod",
			"C:\\Users\\Username\\Saved Games\\DCS\\Scripts\\SomeScript.lua",
		];

		const missionScriptPaths = [
			"C:\\Users\\Username\\Saved Games\\DCS\\Scripts\\DropzoneMissionScriptsBeforeSanitize.lua",
			"C:\\Users\\Username\\Saved Games\\DCS\\Scripts\\DropzoneMissionScriptsAfterSanitize.lua",
		];

		const result = generateRemoveSymlinksScript(installedPaths, missionScriptPaths);

		expect(result).toContain("@echo off");
		expect(result).toContain("echo Removing DCS Dropzone symlinks and generated files...");
		expect(result).toContain("echo Removing symbolic links...");
		expect(result).toContain('if exist "C:\\Users\\Username\\Saved Games\\DCS\\Mods\\aircraft\\MyMod"');
		expect(result).toContain('rmdir /s /q "C:\\Users\\Username\\Saved Games\\DCS\\Mods\\aircraft\\MyMod"');
		expect(result).toContain('if exist "C:\\Users\\Username\\Saved Games\\DCS\\Scripts\\SomeScript.lua"');
		expect(result).toContain("echo Removing Dropzone mission scripting files...");
		expect(result).toContain(
			'if exist "C:\\Users\\Username\\Saved Games\\DCS\\Scripts\\DropzoneMissionScriptsBeforeSanitize.lua" del /f /q',
		);
		expect(result).toContain(
			'if exist "C:\\Users\\Username\\Saved Games\\DCS\\Scripts\\DropzoneMissionScriptsAfterSanitize.lua" del /f /q',
		);
		expect(result).toContain("echo Symlink removal complete.");
		expect(result).toContain("pause");
	});

	it("should generate a valid script with no symlinks (only mission scripts)", () => {
		const missionScriptPaths = [
			"C:\\Users\\Username\\Saved Games\\DCS\\Scripts\\DropzoneMissionScriptsBeforeSanitize.lua",
			"C:\\Users\\Username\\Saved Games\\DCS\\Scripts\\DropzoneMissionScriptsAfterSanitize.lua",
		];

		const result = generateRemoveSymlinksScript([], missionScriptPaths);

		expect(result).toContain("@echo off");
		expect(result).toContain("echo Removing symbolic links...");
		expect(result).toContain("echo Removing Dropzone mission scripting files...");
		expect(result).toContain(
			'if exist "C:\\Users\\Username\\Saved Games\\DCS\\Scripts\\DropzoneMissionScriptsBeforeSanitize.lua" del /f /q',
		);
		expect(result).toContain("echo Symlink removal complete.");
		expect(result).not.toContain("rmdir");
	});

	it("should generate a valid script with no symlinks and no mission scripts", () => {
		const result = generateRemoveSymlinksScript([], []);

		expect(result).toContain("@echo off");
		expect(result).toContain("echo Removing symbolic links...");
		expect(result).toContain("echo Removing Dropzone mission scripting files...");
		expect(result).toContain("echo Symlink removal complete.");
		expect(result).toContain("pause");
	});

	it("should use CRLF line endings for Windows compatibility", () => {
		const result = generateRemoveSymlinksScript([], []);

		// Verify all line endings are CRLF (no standalone LF characters)
		const withoutCrlf = result.replaceAll("\r\n", "");
		expect(withoutCrlf).not.toContain("\n");
	});
});
