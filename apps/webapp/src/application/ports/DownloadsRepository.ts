export interface DownloadsRepository {
	addModReleaseDownload(modId: string, releaseId: string, daemonInstanceId: string): Promise<void>;
	getModReleaseDownloadCount(modId: string, releaseId: string): Promise<number>;
	getModDownloadCount(modId: string): Promise<number>;
}
