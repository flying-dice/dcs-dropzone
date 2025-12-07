import { getLogger } from "log4js";

const logger = getLogger("isPosixPath");

export function isPosixPath(p: string): boolean {
	logger.debug("isPosixPath", p);
	const result = p.startsWith("/");
	logger.debug("isPosixPath", result);
	return result;
}
