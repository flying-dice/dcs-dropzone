import type { DownloadsRepository } from "../application/ports/DownloadsRepository.ts";

/**
 * In-memory test double for DownloadsRepository port.
 */
export class TestDownloadsRepository implements DownloadsRepository {
	private downloads = new Map<string, Set<string>>(); // key: modId:releaseId, value: Set of daemonInstanceIds

	async addModReleaseDownload(modId: string, releaseId: string, daemonInstanceId: string): Promise<void> {
		const key = `${modId}:${releaseId}`;
		if (!this.downloads.has(key)) {
			this.downloads.set(key, new Set());
		}
		this.downloads.get(key)!.add(daemonInstanceId);
	}

	async getModReleaseDownloadCount(modId: string, releaseId: string): Promise<number> {
		const key = `${modId}:${releaseId}`;
		return this.downloads.get(key)?.size ?? 0;
	}

	async getModDownloadCount(modId: string): Promise<number> {
		let count = 0;
		for (const [key, instances] of this.downloads.entries()) {
			if (key.startsWith(`${modId}:`)) {
				count += instances.size;
			}
		}
		return count;
	}

	// Test helper methods
	clear(): void {
		this.downloads.clear();
	}
}
