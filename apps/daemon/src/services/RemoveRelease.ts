import type { DownloadQueue } from "../queues/DownloadQueue.ts";
import type { ExtractQueue } from "../queues/ExtractQueue.ts";
import type { DeleteModAndReleaseForReleaseId } from "../repository/DeleteModAndReleaseForReleaseId.ts";
import type { _RemoveDir } from "./_RemoveDir.ts";
import type { _ResolveReleasePath } from "./_ResolveReleasePath.ts";
import type { DisableRelease } from "./DisableRelease.ts";

export class RemoveRelease {
	constructor(
		protected deps: {
			disableRelease: DisableRelease;
			resolveReleasePath: _ResolveReleasePath;
			downloadQueue: DownloadQueue;
			extractQueue: ExtractQueue;
			deleteModAndReleaseForReleaseId: DeleteModAndReleaseForReleaseId;
			removeDir: _RemoveDir;
		},
	) {}

	execute(releaseId: string): void {
		this.deps.disableRelease.execute(releaseId);

		this.deps.downloadQueue.cancelJobsForRelease(releaseId);
		this.deps.extractQueue.cancelJobsForRelease(releaseId);

		const releaseFolder = this.deps.resolveReleasePath.execute(releaseId);
		this.deps.removeDir.execute(releaseFolder);

		this.deps.deleteModAndReleaseForReleaseId.execute(releaseId);
	}
}
