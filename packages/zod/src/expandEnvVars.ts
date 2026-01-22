/**
 * Allowlist of environment variables that are safe to expand.
 * These are common Windows and Unix environment variables for paths.
 */
const ALLOWED_ENV_VARS = new Set([
	// Windows user directories
	"USERPROFILE",
	"APPDATA",
	"LOCALAPPDATA",
	"TEMP",
	"TMP",
	"HOMEDRIVE",
	"HOMEPATH",
	// Windows program directories
	"PROGRAMFILES",
	"PROGRAMFILES(X86)",
	"PROGRAMDATA",
	// Unix/Linux
	"HOME",
]);

/**
 * Gets the value of an environment variable with special handling for platform-specific naming.
 *
 * @param varName - The variable name as written in the config
 * @param upperVarName - The uppercase version of the variable name
 * @returns The environment variable value or undefined
 */
function getEnvVarValue(varName: string, upperVarName: string): string | undefined {
	// Try the uppercase version first, then original case
	let value = process.env[upperVarName] || process.env[varName];

	// Handle special case for PROGRAMFILES(X86) which might be stored differently:
	// - ProgramFiles(x86) on real Windows systems
	// - PROGRAMFILES_X86 in test environments
	if (!value && upperVarName === "PROGRAMFILES(X86)") {
		value = process.env["ProgramFiles(x86)"] || process.env.PROGRAMFILES_X86;
	}

	return value;
}

/**
 * Expands environment variables in a path string.
 *
 * Supports both Windows-style (%VAR%) and Unix-style ($VAR or ${VAR}) variables.
 * Only expands variables that are in the allowlist for security.
 *
 * @param path - The path string that may contain environment variables
 * @returns The path with environment variables expanded
 *
 * @example
 * ```ts
 * expandEnvVars("%USERPROFILE%/Documents") // "C:/Users/John/Documents"
 * expandEnvVars("$HOME/documents") // "/home/john/documents"
 * expandEnvVars("${APPDATA}/MyApp") // "C:/Users/John/AppData/Roaming/MyApp"
 * ```
 */
export function expandEnvVars(path: string): string {
	let result = path;

	const regexes = [
		/%([A-Za-z0-9_()]+)%/g, // Windows-style: %VAR%
		/\$\{([^}]+)}/g, // Unix-style: ${VAR}
		/\$([A-Za-z_][A-Za-z0-9_()]*)/g, // Unix-style: $VAR
	];

	for (const regex of regexes) {
		result = result.replace(regex, (match, varName) => {
			const upperVarName = varName.toUpperCase();

			// Check if variable is in allowlist
			if (!ALLOWED_ENV_VARS.has(upperVarName)) {
				return match; // Return original match unchanged
			}

			// Get value from environment
			const value = getEnvVarValue(varName, upperVarName);

			if (value === undefined) {
				return match; // Return original match unchanged
			}

			return value;
		});
	}

	return result;
}
