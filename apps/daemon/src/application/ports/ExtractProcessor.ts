import type { Processor } from "@packages/queue";

export type ExtractJobData = {
	archivePath: string;
	destinationFolder: string;
	releaseId: string;
	assetId: string;
};

export type ExtractJobResult = {
	destinationFolder: string;
};

export interface ExtractProcessor extends Processor<ExtractJobData, ExtractJobResult> {
	name: "extract";
}
