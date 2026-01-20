import { getLogger } from "log4js";

const logger = getLogger("expandEnvVars");

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

	// Windows-style variables: %VAR%
	// Match %VARNAME% pattern, capturing the variable name (including parentheses)
	// Use non-greedy match and explicitly exclude % inside the variable name
	result = result.replace(/%([A-Za-z0-9_()]+)%/g, (match, varName) => {
		const upperVarName = varName.toUpperCase();

		// Check if variable is in allowlist
		if (!ALLOWED_ENV_VARS.has(upperVarName)) {
			logger.warn(
				`Environment variable '${varName}' is not in the allowlist and will not be expanded. Supported variables: ${Array.from(ALLOWED_ENV_VARS).join(", ")}`,
			);
			return match; // Return original match unchanged
		}

		// Get value from environment (case-insensitive on Windows)
		// Try different case variations and also try with 'ProgramFiles(x86)' style
		const value =
			process.env[upperVarName] ||
			process.env[varName] ||
			// Handle special case for PROGRAMFILES(X86) which might be stored as:
			// - ProgramFiles(x86) on real Windows systems
			// - PROGRAMFILES_X86 in test environments
			(upperVarName === "PROGRAMFILES(X86)"
				? process.env["ProgramFiles(x86)"] || process.env.PROGRAMFILES_X86
				: undefined);

		if (value === undefined) {
			logger.warn(
				`Environment variable '${varName}' is not set and cannot be expanded. The path will contain the literal variable reference.`,
			);
			return match; // Return original match unchanged
		}

		logger.debug(`Expanded %${varName}% to: ${value}`);
		return value;
	});

	// Unix-style variables: $VAR or ${VAR}
	// First, handle ${VAR} pattern
	result = result.replace(/\$\{([^}]+)\}/g, (match, varName) => {
		const upperVarName = varName.toUpperCase();

		if (!ALLOWED_ENV_VARS.has(upperVarName)) {
			logger.warn(
				`Environment variable '${varName}' is not in the allowlist and will not be expanded. Supported variables: ${Array.from(ALLOWED_ENV_VARS).join(", ")}`,
			);
			return match;
		}

		const value = process.env[upperVarName] || process.env[varName];

		if (value === undefined) {
			logger.warn(
				`Environment variable '${varName}' is not set and cannot be expanded. The path will contain the literal variable reference.`,
			);
			return match;
		}

		logger.debug(`Expanded \${${varName}} to: ${value}`);
		return value;
	});

	// Then handle $VAR pattern (without braces)
	// Match $VARNAME where VARNAME is alphanumeric + underscore
	result = result.replace(/\$([A-Za-z_][A-Za-z0-9_]*)/g, (match, varName) => {
		const upperVarName = varName.toUpperCase();

		if (!ALLOWED_ENV_VARS.has(upperVarName)) {
			logger.warn(
				`Environment variable '${varName}' is not in the allowlist and will not be expanded. Supported variables: ${Array.from(ALLOWED_ENV_VARS).join(", ")}`,
			);
			return match;
		}

		const value = process.env[upperVarName] || process.env[varName];

		if (value === undefined) {
			logger.warn(
				`Environment variable '${varName}' is not set and cannot be expanded. The path will contain the literal variable reference.`,
			);
			return match;
		}

		logger.debug(`Expanded $${varName} to: ${value}`);
		return value;
	});

	return result;
}
