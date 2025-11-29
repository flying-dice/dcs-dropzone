import type { SymbolicLinkDestRoot } from "../../common/data.ts";

export type ModReleaseSymbolicLinkRow = {
	id: string;
	releaseId: string;
	name: string;
	src: string;
	dest: string;
	destRoot: SymbolicLinkDestRoot;
	installedPath: string | null;
};

export interface ModReleaseSymbolicLinkRepository {
	getByReleaseId(releaseId: string): ModReleaseSymbolicLinkRow[];
	setInstalledPath(id: string, installedPath: string | null): void;
}
