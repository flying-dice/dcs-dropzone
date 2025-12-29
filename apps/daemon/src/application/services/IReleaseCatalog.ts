import type { ModAndReleaseData } from "../schemas/ModAndReleaseData.ts";

export interface IReleaseCatalog {
	add(data: ModAndReleaseData): void;
	remove(releaseId: string): void;
	getAllReleasesWithStatus(): ModAndReleaseData[];
}
