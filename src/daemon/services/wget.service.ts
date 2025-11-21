import { spawn } from "node:child_process";
import { statSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { pathExistsSync } from "fs-extra";
import { extractPercentage } from "../functions/extract-percentage.ts";
import { getLogger } from "../Logger.ts";

export type WgetProps = {
	exePath: string;
};

export type WgetDownloadOptions = {
	url: string;
	target: string;
	onProgress: (progress: { progress: number; summary?: string }) => void;
};

// https://www.gnu.org/software/wget/manual/html_node/Exit-Status.html
function getWgetErrorMessage(code: number | null): string {
	if (code === null) return "Process terminated without exit code";

	switch (code) {
		case 0:
			return "No problems occurred";
		case 1:
			return "Generic error code";
		case 2:
			return "Parse error — invalid command line options";
		case 3:
			return "File I/O error";
		case 4:
			return "Network failure";
		case 5:
			return "SSL verification failure";
		case 6:
			return "Authentication failure";
		case 7:
			return "Protocol error";
		case 8:
			return "Server issued an error response";
		default:
			return "Unknown error";
	}
}

export class WgetService {
	private readonly logger = getLogger(WgetService.name);
	private readonly exePath: string;

	constructor({ exePath }: WgetProps) {
		this.exePath = resolve(exePath);

		if (!pathExistsSync(this.exePath)) {
			throw new Error(`wget executable not found at path: ${this.exePath}`);
		}

		if (statSync(this.exePath).isDirectory()) {
			throw new Error(`wget executable path is a directory: ${this.exePath}`);
		}
	}

	async download({ url, target, onProgress }: WgetDownloadOptions) {
		statSync(this.exePath);

		const absoluteTarget = resolve(target);

		await mkdir(absoluteTarget, { recursive: true });

		const args = [
			"--progress=bar:force:giga",
			"--show-progress",
			"--no-clobber",
			url,
		];

		const _wget = spawn(this.exePath, args, {
			stdio: "pipe",
			cwd: absoluteTarget,
		});

		_wget.on("spawn", () => {
			onProgress({ progress: 0 });
		});

		// This is due to the fact that wget writes to stderr https://www.gnu.org/software/wget/manual/wget.html#Logging-and-Input-File-Options:~:text=Log%20all%20messages%20to%20logfile.%20The%20messages%20are%20normally%20reported%20to%20standard%20error.
		_wget.stderr.on("data", (data) => {
			if (!data) return;
			const summary = data
				.toString()
				.replace("wget.exe", "")
				.replace(/\[=+>+]/, "")
				.replace(/\s+/g, " ")
				.trim();
			const progress = extractPercentage(summary);
			if (progress && onProgress) {
				onProgress({ progress, summary });
			}
		});

		_wget.on("error", (err) => {
			_wget.removeAllListeners();
			this.logger.error(`Failed to start wget: ${err}`);
		});

		await new Promise((resolve, reject) => {
			_wget.on("close", (code) => {
				if (code === 0) {
					_wget.removeAllListeners();
					onProgress({ progress: 100 });
					resolve(code);
				} else {
					_wget.removeAllListeners();
					reject(
						new Error(
							`Failed to download file, code: ${code} - ${getWgetErrorMessage(code)}`,
						),
					);
				}
			});
		});

		this.logger.info("Downloaded file successfully");

		return join(absoluteTarget, basename(url));
	}
}
