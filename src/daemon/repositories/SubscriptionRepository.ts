import type { ModReleaseData } from "../schemas/ModAndReleaseData.ts";

export interface SubscriptionRepository {
	getAll(): { modId: string; releaseId: string }[];
	saveRelease(data: ModReleaseData): void;
	deleteByReleaseId(releaseId: string): void;
}
