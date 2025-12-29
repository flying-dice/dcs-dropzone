import type { ModAndReleaseData } from "../schemas/ModAndReleaseData.ts";

export interface ReleaseCatalog {
	add(data: ModAndReleaseData): void;
	remove(releaseId: string): void;
	getAllReleasesWithStatus(): ModAndReleaseData[];
}

export { BaseReleaseCatalog } from "./impl/BaseReleaseCatalog.ts";
