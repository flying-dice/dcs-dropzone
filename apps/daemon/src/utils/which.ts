import { delimiter, dirname, join } from "node:path";
import { getLogger } from "log4js";

const logger = getLogger("which");

/**
 * Finds the full path of a command in the system's PATH.
 *
 * Searches in the "bin" directory next to the executable,
 * the cwd "bin" directory, and then the system PATH.
 */
export function which(command: string): string | null {
	logger.debug("Resolving command:", command);
	const exeBin = join(dirname(process.execPath), "bin");
	const cwdBin = join(process.cwd(), "bin");
	const PATH = [exeBin, cwdBin, process.env.PATH].join(delimiter);
	logger.debug(`Resolving ${command} in ${PATH}`);

	const resolved = Bun.which(command, { PATH });
	logger.debug("Resolved path:", resolved);
	return resolved;
}
