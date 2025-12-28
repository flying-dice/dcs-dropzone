import type { ModAndReleaseData } from "../schemas/ModAndReleaseData.ts";

export interface SaveModAndRelease {
	execute(data: ModAndReleaseData): void;
}
