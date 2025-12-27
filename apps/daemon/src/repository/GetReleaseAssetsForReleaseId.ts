export interface GetReleaseAssetsForReleaseId {
	execute(releaseId: string): {
		id: string;
		releaseId: string;
		name: string;
		isArchive: boolean;
		urls: string[];
	}[];
}
