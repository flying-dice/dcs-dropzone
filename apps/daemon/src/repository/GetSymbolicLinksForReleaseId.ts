import type { SymbolicLinkDestRoot } from "webapp";

export interface GetSymbolicLinksForReleaseId {
	execute(releaseId: string): {
		id: string;
		releaseId: string;
		name: string;
		src: string;
		dest: string;
		destRoot: SymbolicLinkDestRoot;
		installedPath: string | null;
	}[];
}
