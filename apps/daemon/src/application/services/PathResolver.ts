import type { SymbolicLinkDestRoot } from "webapp";

export interface PathResolver {
	resolveReleasePath(releaseId: string, path?: string): string;
	resolveSymbolicLinkPath(root: SymbolicLinkDestRoot, path?: string): string;
}
