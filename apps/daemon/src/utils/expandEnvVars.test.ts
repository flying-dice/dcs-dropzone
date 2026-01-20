import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import { expandEnvVars } from "./expandEnvVars";

describe("expandEnvVars", () => {
	let originalEnv: Record<string, string | undefined>;

	beforeEach(() => {
		// Save original environment
		originalEnv = { ...process.env };
		// Set up test environment variables
		process.env.USERPROFILE = "C:/Users/TestUser";
		process.env.APPDATA = "C:/Users/TestUser/AppData/Roaming";
		process.env.LOCALAPPDATA = "C:/Users/TestUser/AppData/Local";
		process.env.PROGRAMFILES = "C:/Program Files";
		process.env.PROGRAMFILES_X86 = "C:/Program Files (x86)";
		process.env.PROGRAMDATA = "C:/ProgramData";
		process.env.TEMP = "C:/Users/TestUser/AppData/Local/Temp";
		process.env.TMP = "C:/Users/TestUser/AppData/Local/Temp";
		process.env.HOME = "/home/testuser";
		process.env.HOMEDRIVE = "C:";
		process.env.HOMEPATH = "/Users/TestUser";
		process.env.UNSUPPORTED_VAR = "should-not-expand";
	});

	afterEach(() => {
		// Restore original environment
		process.env = originalEnv;
	});

	describe("Windows-style expansion (%VAR%)", () => {
		it("should expand USERPROFILE variable", () => {
			const result = expandEnvVars("%USERPROFILE%/Documents");
			expect(result).toBe("C:/Users/TestUser/Documents");
		});

		it("should expand APPDATA variable", () => {
			const result = expandEnvVars("%APPDATA%/MyApp");
			expect(result).toBe("C:/Users/TestUser/AppData/Roaming/MyApp");
		});

		it("should expand LOCALAPPDATA variable", () => {
			const result = expandEnvVars("%LOCALAPPDATA%/MyApp");
			expect(result).toBe("C:/Users/TestUser/AppData/Local/MyApp");
		});

		it("should expand PROGRAMFILES variable", () => {
			const result = expandEnvVars("%PROGRAMFILES%/MyApp");
			expect(result).toBe("C:/Program Files/MyApp");
		});

		it("should expand PROGRAMFILES(X86) variable", () => {
			const result = expandEnvVars("%PROGRAMFILES(X86)%/MyApp");
			expect(result).toBe("C:/Program Files (x86)/MyApp");
		});

		it("should expand PROGRAMDATA variable", () => {
			const result = expandEnvVars("%PROGRAMDATA%/MyApp");
			expect(result).toBe("C:/ProgramData/MyApp");
		});

		it("should expand TEMP variable", () => {
			const result = expandEnvVars("%TEMP%/file.txt");
			expect(result).toBe("C:/Users/TestUser/AppData/Local/Temp/file.txt");
		});

		it("should expand TMP variable", () => {
			const result = expandEnvVars("%TMP%/file.txt");
			expect(result).toBe("C:/Users/TestUser/AppData/Local/Temp/file.txt");
		});

		it("should expand HOME variable", () => {
			const result = expandEnvVars("%HOME%/documents");
			expect(result).toBe("/home/testuser/documents");
		});

		it("should expand HOMEDRIVE variable", () => {
			const result = expandEnvVars("%HOMEDRIVE%/folder");
			expect(result).toBe("C:/folder");
		});

		it("should expand HOMEPATH variable", () => {
			const result = expandEnvVars("%HOMEPATH%/folder");
			expect(result).toBe("/Users/TestUser/folder");
		});

		it("should expand multiple variables in one path", () => {
			const result = expandEnvVars("%USERPROFILE%/AppData/%TEMP%");
			expect(result).toBe("C:/Users/TestUser/AppData/C:/Users/TestUser/AppData/Local/Temp");
		});

		it("should handle paths with no variables", () => {
			const result = expandEnvVars("C:/Program Files/MyApp");
			expect(result).toBe("C:/Program Files/MyApp");
		});

		it("should leave unsupported variables unexpanded and log warning", () => {
			const result = expandEnvVars("%UNSUPPORTED_VAR%/path");
			expect(result).toBe("%UNSUPPORTED_VAR%/path");
		});

		it("should leave undefined allowlisted variables unexpanded and log warning", () => {
			delete process.env.USERPROFILE;
			const result = expandEnvVars("%USERPROFILE%/Documents");
			expect(result).toBe("%USERPROFILE%/Documents");
		});

		it("should handle mixed case variable names (case-insensitive on Windows)", () => {
			const result = expandEnvVars("%UserProfile%/Documents");
			expect(result).toBe("C:/Users/TestUser/Documents");
		});

		it("should handle variables at the start, middle, and end", () => {
			const start = expandEnvVars("%USERPROFILE%/Documents");
			expect(start).toBe("C:/Users/TestUser/Documents");

			const middle = expandEnvVars("C:/Users/%APPDATA%/test");
			expect(middle).toBe("C:/Users/C:/Users/TestUser/AppData/Roaming/test");

			const end = expandEnvVars("C:/Users/TestUser/%APPDATA%");
			expect(end).toBe("C:/Users/TestUser/C:/Users/TestUser/AppData/Roaming");
		});
	});

	describe("Unix-style expansion ($VAR or ${VAR})", () => {
		it("should expand $HOME variable", () => {
			const result = expandEnvVars("$HOME/documents");
			expect(result).toBe("/home/testuser/documents");
		});

		it("should expand ${HOME} variable with braces", () => {
			const result = expandEnvVars("${HOME}/documents");
			expect(result).toBe("/home/testuser/documents");
		});

		it("should expand $USERPROFILE variable", () => {
			const result = expandEnvVars("$USERPROFILE/Documents");
			expect(result).toBe("C:/Users/TestUser/Documents");
		});

		it("should expand ${APPDATA} variable", () => {
			const result = expandEnvVars("${APPDATA}/MyApp");
			expect(result).toBe("C:/Users/TestUser/AppData/Roaming/MyApp");
		});

		it("should leave unsupported $VAR unexpanded", () => {
			const result = expandEnvVars("$UNSUPPORTED_VAR/path");
			expect(result).toBe("$UNSUPPORTED_VAR/path");
		});

		it("should leave unsupported ${VAR} unexpanded", () => {
			const result = expandEnvVars("${UNSUPPORTED_VAR}/path");
			expect(result).toBe("${UNSUPPORTED_VAR}/path");
		});

		it("should handle paths with both Unix and Windows style", () => {
			const result = expandEnvVars("%USERPROFILE%/$HOME/mixed");
			expect(result).toBe("C:/Users/TestUser//home/testuser/mixed");
		});
	});

	describe("Edge cases", () => {
		it("should handle empty string", () => {
			const result = expandEnvVars("");
			expect(result).toBe("");
		});

		it("should handle path with only variable", () => {
			const result = expandEnvVars("%USERPROFILE%");
			expect(result).toBe("C:/Users/TestUser");
		});

		it("should handle consecutive variables", () => {
			const result = expandEnvVars("%HOMEDRIVE%%HOMEPATH%");
			expect(result).toBe("C:/Users/TestUser");
		});

		it("should handle malformed variables (single %)", () => {
			const result = expandEnvVars("C:/Path%WithoutClosing");
			expect(result).toBe("C:/Path%WithoutClosing");
		});

		it("should handle empty variable names", () => {
			const result = expandEnvVars("%%/path");
			expect(result).toBe("%%/path");
		});

		it("should handle special characters in paths after expansion", () => {
			process.env.USERPROFILE = "C:/Users/Test User (Special)";
			const result = expandEnvVars("%USERPROFILE%/Documents");
			expect(result).toBe("C:/Users/Test User (Special)/Documents");
		});
	});
});
