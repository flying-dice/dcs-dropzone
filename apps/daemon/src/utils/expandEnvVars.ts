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
 * Logs a warning for an unsupported environment variable.
 */
function warnUnsupportedVar(varName: string): void {
	logger.warn(
		`Environment variable '${varName}' is not in the allowlist and will not be expanded. Supported variables: ${Array.from(ALLOWED_ENV_VARS).join(", ")}`,
	);
}

/**
 * Logs a warning for an undefined environment variable.
 */
function warnUndefinedVar(varName: string): void {
	logger.warn(
		`Environment variable '${varName}' is not set and cannot be expanded. The path will contain the literal variable reference.`,
	);
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

	// Windows-style variables: %VAR%
	// Match %VARNAME% pattern, capturing the variable name (alphanumeric, underscore, and parentheses)
	result = result.replace(/%([A-Za-z0-9_()]+)%/g, (match, varName) => {
		const upperVarName = varName.toUpperCase();

		// Check if variable is in allowlist
		if (!ALLOWED_ENV_VARS.has(upperVarName)) {
			warnUnsupportedVar(varName);
			return match; // Return original match unchanged
		}

		// Get value from environment
		const value = getEnvVarValue(varName, upperVarName);

		if (value === undefined) {
			warnUndefinedVar(varName);
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
			warnUnsupportedVar(varName);
			return match;
		}

		const value = getEnvVarValue(varName, upperVarName);

		if (value === undefined) {
			warnUndefinedVar(varName);
			return match;
		}

		logger.debug(`Expanded \${${varName}} to: ${value}`);
		return value;
	});

	// Then handle $VAR pattern (without braces)
	// Match $VARNAME where VARNAME is alphanumeric, underscore, and parentheses
	result = result.replace(/\$([A-Za-z_][A-Za-z0-9_()]*)/g, (match, varName) => {
		const upperVarName = varName.toUpperCase();

		if (!ALLOWED_ENV_VARS.has(upperVarName)) {
			warnUnsupportedVar(varName);
			return match;
		}

		const value = getEnvVarValue(varName, upperVarName);

		if (value === undefined) {
			warnUndefinedVar(varName);
			return match;
		}

		logger.debug(`Expanded $${varName} to: ${value}`);
		return value;
	});

	return result;
}
