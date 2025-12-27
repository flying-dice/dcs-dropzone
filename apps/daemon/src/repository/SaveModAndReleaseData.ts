import type { ModAndReleaseData } from "../schemas/ModAndReleaseData.ts";

export interface SaveModAndReleaseData {
	execute(data: ModAndReleaseData): void;
}
