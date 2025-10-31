import { spawn } from "node:child_process";
import { statSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathExistsSync } from "fs-extra";
import { extractPercentage } from "../functions/extract-percentage.ts";
import { getLogger } from "../logger.ts";

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

export type SevenzipProps = {
	exePath: string;
};

export type SevenzipExtractOptions = {
	archivePath: string;
	targetDir: string;
	onProgress: (progress: { progress: number; summary?: string }) => void;
};

// https://documentation.help/7-Zip/exit_codes.htm
function getSevenzipErrorMessage(code: number | null): string {
	if (code === null) return "Process terminated without exit code";

	switch (code) {
		case 0:
			return "No error";
		case 1:
			return "Warning (Non fatal error(s))";
		case 2:
			return "Fatal error";
		case 7:
			return "Command line error";
		case 8:
			return "Not enough memory for operation";
		case 255:
			return "User stopped the process";
		default:
			return "Unknown error";
	}
}

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

	async extract({
		archivePath,
		targetDir,
		onProgress,
	}: SevenzipExtractOptions): Promise<string> {
		const absoluteArchivePath = resolve(archivePath);
		const absoluteTargetDir = resolve(targetDir);

		await mkdir(absoluteTargetDir, { recursive: true });

		const args = [
			"-bso1",
			"-bsp1",
			"-y",
			"x",
			absoluteArchivePath,
			`-o${absoluteTargetDir}`,
		];

		this.logger.verbose(["\n", this.exePath, ...args].join(" "));

		const _7zip = spawn(this.exePath, args, { stdio: "pipe" });

		_7zip.on("spawn", () => {
			onProgress({ progress: 0 });
		});

		_7zip.stdout.on("data", (data) => {
			if (!data) return;
			const summary = data.toString().trim();
			const progress = extractPercentage(summary);
			if (progress) {
				onProgress({ progress, summary });
			}
		});

		_7zip.stderr.on("data", (data) => {
			if (!data) return;
			const summary = data.toString().trim();
			const progress = extractPercentage(summary);
			if (progress) {
				onProgress({ progress, summary });
			}
		});


		await new Promise((resolve, reject) => {
			_7zip.on("error", (err) => {
				_7zip.removeAllListeners();
				this.logger.error(`Failed to start Seven Zip: ${err}`);
				reject(err);
			});
			_7zip.on("close", (code) => {
				if (code === 0) {
					_7zip.removeAllListeners();
					onProgress({ progress: 100 });
					resolve(code);
				} else {
					_7zip.removeAllListeners();
					reject(
						new Error(
							`Failed to Extract Archive, code: ${code} - ${getSevenzipErrorMessage(code)}`,
						),
					);
				}
			});
		});

		this.logger.info("Extracted archive successfully");

		return absoluteTargetDir;
	}
}
