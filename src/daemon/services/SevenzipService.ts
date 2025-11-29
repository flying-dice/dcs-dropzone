import { statSync } from "node:fs";
import { resolve } from "node:path";
import { pathExistsSync } from "fs-extra";
import { getLogger } from "log4js";
import {
	type SpawnSevenzipProps,
	spawnSevenzip,
} from "../child_process/sevenzip.ts";

/**
 * @deprecated Use the ExtractQueue with spawnSevenzip child process instead.
 * This service is kept for backward compatibility but should not be used for new code.
 * @see src/daemon/queues/ExtractQueue.ts
 * @see src/daemon/child_process/sevenzip.ts
 */
export const SUPPORTED_ARCHIVE_EXTENSIONS = [
	"7z",
	"bzip2",
	"gzip",
	"lzma",
	"lzma86",
	"tar",
	"xz",
	"zip",
	"zstd",
];

/**
 * @deprecated Use the ExtractQueue with spawnSevenzip child process instead.
 * This service is kept for backward compatibility but should not be used for new code.
 * @see src/daemon/queues/ExtractQueue.ts
 * @see src/daemon/child_process/sevenzip.ts
 */
export type SevenzipProps = {
	exePath: string;
};

/**
 * @deprecated Use the ExtractQueue with spawnSevenzip child process instead.
 * This service is kept for backward compatibility but should not be used for new code.
 * @see src/daemon/queues/ExtractQueue.ts
 * @see src/daemon/child_process/sevenzip.ts
 */
export type SevenzipExtractOptions = {
	archivePath: string;
	targetDir: string;
	onProgress: (progress: { progress: number; summary?: string }) => void;
};

/**
 * @deprecated Use the ExtractQueue with spawnSevenzip child process instead.
 * This service is kept for backward compatibility but should not be used for new code.
 * @see src/daemon/queues/ExtractQueue.ts
 * @see src/daemon/child_process/sevenzip.ts
 */
export class SevenzipService {
	private readonly logger = getLogger(SevenzipService.name);
	private readonly exePath: string;

	constructor({ exePath }: SevenzipProps) {
		this.exePath = resolve(exePath);

		if (!pathExistsSync(this.exePath)) {
			throw new Error(`7z executable not found at path: ${this.exePath}`);
		}

		if (statSync(this.exePath).isDirectory()) {
			throw new Error(`7z executable path is a directory: ${this.exePath}`);
		}
	}

	async extract(
		{ archivePath, targetDir, onProgress }: SevenzipExtractOptions,
		abortSignal?: AbortSignal,
	): Promise<string> {
		const props: SpawnSevenzipProps = {
			exePath: this.exePath,
			archivePath,
			targetDir,
			onProgress,
		};

		const result = await spawnSevenzip(props, abortSignal);

		if (result.isErr()) {
			throw new Error(`Extraction failed: ${result.error}`);
		}

		this.logger.info("Extracted archive successfully");
		return result.value;
	}
}
