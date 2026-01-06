import { delimiter, join } from "node:path";
import { getLogger } from "log4js";

const logger = getLogger("which");

/**
 * Finds the full path of a command in the system's PATH.
 *
 * Adds the local "bin" directory to the PATH for resolution.
 */
export function which(command: string): string | null {
	logger.trace("Resolving command:", command);
	const resolved = Bun.which(command, { PATH: [join(process.cwd(), "bin"), process.env.PATH].join(delimiter) });
	logger.trace("Resolved path:", resolved);
	return resolved;
}
