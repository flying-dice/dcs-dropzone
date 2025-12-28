export interface GetAllReleases {
	execute(): {
		releaseId: string;
		modId: string;
		modName: string;
		version: string;
		versionHash: string;
		dependencies: string[];
	}[];
}
