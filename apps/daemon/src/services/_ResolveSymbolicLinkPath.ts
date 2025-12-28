import { resolve } from "node:path";
import type { SymbolicLinkDestRoot } from "webapp";

export class _ResolveSymbolicLinkPath {
	constructor(
		protected deps: {
			dcsPaths: Record<SymbolicLinkDestRoot, string>;
		},
	) {}

	execute(root: SymbolicLinkDestRoot, path?: string): string {
		const rootPath = this.deps.dcsPaths[root];

		if (!rootPath) {
			throw new Error(`Path for destRoot ${root} is not configured`);
		}

		if (path) {
			return resolve(rootPath, path);
		}

		return resolve(rootPath);
	}
}
