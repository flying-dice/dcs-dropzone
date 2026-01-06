import { delimiter, join } from "node:path";

/**
 * Finds the full path of a command in the system's PATH.
 *
 * Adds the local "bin" directory to the PATH for resolution.
 */
export function which(command: string): string | null {
	return Bun.which(command, { PATH: [join(process.cwd(), "bin"), process.env.PATH].join(delimiter) });
}
