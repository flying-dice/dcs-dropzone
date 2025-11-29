import { posix, win32 } from "node:path";
import { isPosixPath } from "./isPosixPath.ts";

export function secureJoin(root: string, child: string): string {
	const { normalize, resolve, relative } = isPosixPath(root) ? posix : win32;

	const rootNorm = normalize(resolve(root));
	const target = normalize(resolve(rootNorm, child));
	const rel = relative(rootNorm, target);
	if (rel === "" || rel === ".") return target;
	if (rel.startsWith("..") || rel.includes(":\\") || rel.startsWith("/")) {
		throw new Error(`Resolved path escapes root: ${child}`);
	}
	return target;
}
