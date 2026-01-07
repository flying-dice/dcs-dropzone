import { basename, join } from "node:path";
import { Log } from "@packages/decorators";
import { type JobRecord, type JobRecordRepository, JobState, Queue, QueueEvents } from "@packages/queue";
import { getLogger } from "log4js";
import { inferAssetStatusFromJobs } from "../functions/inferAssetStatusFromJobs.ts";
import { totalPercentProgress } from "../functions/totalPercentProgress.ts";
import type { DownloadJobData, DownloadJobResult, DownloadProcessor } from "../ports/DownloadProcessor.ts";
import type { ExtractJobData, ExtractJobResult, ExtractProcessor } from "../ports/ExtractProcessor.ts";
import type { FileSystem } from "../ports/FileSystem.ts";
import type { ReleaseRepository } from "../ports/ReleaseRepository.ts";
import { ModReleaseAssetStatusData } from "../schemas/ModAndReleaseData.ts";
import type { ReleaseAsset } from "../schemas/ReleaseAsset.ts";
import type { PathResolver } from "./PathResolver.ts";

const logger = getLogger("ReleaseAssetCoordinator");

type Deps = {
	releaseRepository: ReleaseRepository;
	jobRecordRepository: JobRecordRepository;
	downloadProcessor: DownloadProcessor;
	extractProcessor: ExtractProcessor;
	pathResolver: PathResolver;
	fileSystem: FileSystem;
};

export class ReleaseAssetManager {
	private readonly queue: Queue;

	constructor(protected deps: Deps) {
		this.queue = new Queue(
			{ jobRecordRepository: this.deps.jobRecordRepository },
			{ pollIntervalMs: 500, processors: [deps.downloadProcessor, deps.extractProcessor] },
		);

		this.queue.start();
		this.queue.on(
			QueueEvents.Succeeded,
			(job: JobRecord<DownloadJobData, DownloadJobResult> | JobRecord<ExtractJobData, ExtractJobResult>) => {
				if (job.processorName === deps.downloadProcessor.name) {
					const { extractJobs, downloadJobs } = this.getAllJobsForReleaseId(job.jobData.releaseId);

					if (downloadJobs.every((it) => it.state === JobState.Success)) {
						for (const extractJob of extractJobs) {
							if (extractJob.state === JobState.Pending) {
								this.queue.moveFromPendingToWaiting(extractJob.runId);
							}
						}
					}
				}
			},
		);
	}

	@Log(logger)
	getProgressReportForAssets(releaseId: string): Record<string, ModReleaseAssetStatusData> {
		const assets = this.deps.releaseRepository.getReleaseAssetsForRelease(releaseId);
		const assetStatusData: Record<string, ModReleaseAssetStatusData> = {};

		const { allJobs, downloadJobs, extractJobs } = this.getAllJobsForReleaseId(releaseId);

		for (const asset of assets) {
			const relatedDownloadJobs = downloadJobs.filter((job) => job.jobData.assetId === asset.id);
			const relatedExtractJobs = extractJobs.filter((job) => job.jobData.assetId === asset.id);

			const modReleaseAssetStatusData: ModReleaseAssetStatusData = {
				status: inferAssetStatusFromJobs(relatedDownloadJobs, relatedExtractJobs),
				downloadPercentProgress: totalPercentProgress(relatedDownloadJobs.map((it) => it.progress ?? 0)),
				extractPercentProgress: totalPercentProgress(relatedExtractJobs.map((it) => it.progress ?? 0)),
				overallPercentProgress: totalPercentProgress(allJobs.map((it) => it.progress ?? 0)),
			};

			assetStatusData[asset.id] = ModReleaseAssetStatusData.parse(modReleaseAssetStatusData);
		}

		return assetStatusData;
	}

	@Log(logger)
	addRelease(releaseId: string) {
		const releaseFolder = this.deps.pathResolver.resolveReleasePath(releaseId);
		this.deps.fileSystem.ensureDir(releaseFolder);

		const assets = this.deps.releaseRepository.getReleaseAssetsForRelease(releaseId);

		for (const asset of assets) {
			for (const url of asset.urls) {
				const downloadJobData = this.getDownloadJobData(asset, url);
				const downloadJob = this.queue.add(this.deps.downloadProcessor.name, downloadJobData);
				this.deps.releaseRepository.addJobForRelease(releaseId, downloadJob.jobId);
			}

			const extractJobData = this.getExtractJobData(asset);
			if (extractJobData) {
				const extractJob = this.queue.add(this.deps.extractProcessor.name, extractJobData, JobState.Pending);
				this.deps.releaseRepository.addJobForRelease(releaseId, extractJob.jobId);
			}
		}
	}

	@Log(logger)
	removeRelease(releaseId: string) {
		for (const jobId of this.deps.releaseRepository.getJobIdsForRelease(releaseId)) {
			const job = this.queue.getLatestByJobId(jobId);
			if (job && [JobState.Pending, JobState.Waiting, JobState.Running].includes(job.state)) {
				this.queue.cancel(job);
			}
		}

		const releaseFolder = this.deps.pathResolver.resolveReleasePath(releaseId);
		this.deps.fileSystem.removeDir(releaseFolder);

		this.deps.releaseRepository.clearJobsForRelease(releaseId);
	}

	@Log(logger)
	isReleaseReady(releaseId: string) {
		const allJobs = this.deps.releaseRepository
			.getJobIdsForRelease(releaseId)
			.flatMap((it) => this.queue.getAllByJobId(it));

		return !allJobs.some((it) => [JobState.Pending, JobState.Running].includes(it.state));
	}

	private getAllJobsForReleaseId(
		releaseId: string,
		filter?: (jobRecord: JobRecord) => boolean,
	): {
		allJobs: (JobRecord<DownloadJobData, DownloadJobResult> | JobRecord<ExtractJobData, ExtractJobResult>)[];
		downloadJobs: JobRecord<DownloadJobData, DownloadJobResult>[];
		extractJobs: JobRecord<ExtractJobData, ExtractJobResult>[];
	} {
		const allJobs: (JobRecord<DownloadJobData, DownloadJobResult> | JobRecord<ExtractJobData, ExtractJobResult>)[] = [];
		const downloadJobs: JobRecord<DownloadJobData, DownloadJobResult>[] = [];
		const extractJobs: JobRecord<ExtractJobData, ExtractJobResult>[] = [];

		for (const jobId of this.deps.releaseRepository.getJobIdsForRelease(releaseId)) {
			const job = this.queue.getLatestByJobId(jobId);

			if (!job) {
				logger.warn("Job not found for jobId:", jobId);
				continue;
			}

			if (filter && !filter(job)) {
				continue;
			}

			allJobs.push(job);

			if (job.processorName === this.deps.downloadProcessor.name) {
				downloadJobs.push(job as JobRecord<DownloadJobData, DownloadJobResult>);
			}

			if (job.processorName === this.deps.extractProcessor.name) {
				extractJobs.push(job as JobRecord<ExtractJobData, ExtractJobResult>);
			}
		}

		return {
			allJobs,
			downloadJobs,
			extractJobs,
		};
	}

	private getDownloadJobData(asset: ReleaseAsset, url: ReleaseAsset["urls"][number]): DownloadJobData {
		return {
			url: url.url,
			urlId: url.id,
			destinationFolder: this.deps.pathResolver.resolveReleasePath(asset.releaseId),
			releaseId: asset.releaseId,
			assetId: asset.id,
		};
	}

	private getExtractJobData(asset: ReleaseAsset): ExtractJobData | undefined {
		if (asset.isArchive) {
			const releaseFolder = this.deps.pathResolver.resolveReleasePath(asset.releaseId);
			const firstUrl = asset.urls[0]?.url;
			if (firstUrl) {
				const archivePath = join(releaseFolder, decodeURIComponent(basename(firstUrl)));
				return {
					releaseId: asset.releaseId,
					assetId: asset.id,
					destinationFolder: releaseFolder,
					archivePath,
				};
			}
		}
	}
}
