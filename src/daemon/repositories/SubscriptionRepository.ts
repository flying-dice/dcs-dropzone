import type { ModAndReleaseData } from "../schemas/ModAndReleaseData.ts";

export interface SubscriptionRepository {
	getAll(): ModAndReleaseData[];
	saveRelease(data: ModAndReleaseData): void;
	deleteByReleaseId(releaseId: string): void;
}
