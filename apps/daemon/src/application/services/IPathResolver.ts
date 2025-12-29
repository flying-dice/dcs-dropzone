import type { SymbolicLinkDestRoot } from "webapp";

export interface IPathResolver {
	resolveReleasePath(releaseId: string, path?: string): string;
	resolveSymbolicLinkPath(root: SymbolicLinkDestRoot, path?: string): string;
}
