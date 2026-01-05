import type { Processor } from "@packages/queue";

export type DownloadJobData = {
	url: string;
	destinationFolder: string;
	releaseId: string;
	assetId: string;
	urlId: string;
};

export type DownloadJobResult = {
	filePath: string;
};

export interface DownloadProcessor extends Processor<DownloadJobData, DownloadJobResult> {
	name: "download";
}
