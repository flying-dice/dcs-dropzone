import { spawn } from "node:child_process";
import { statSync } from "node:fs";
import { basename, resolve } from "node:path";
import { pathExistsSync } from "fs-extra";
import type { Logger } from "pino";
import { extractPercentage } from "../functions/extract-percentage.ts";
import {
	BaseProcess,
	type ProcessProgress,
	type ProcessResult,
} from "./BaseProcess.ts";

/**
 * Wget process options
 */
export type WgetProcessOptions = {
	jobId: string;
	url: string;
	targetDirectory: string;
	wgetExecutablePath: string;
	logger: Logger;
};

/**
 * Concrete Wget Process Implementation
 * Handles wget-specific argument construction and progress parsing
 */
export class WgetProcess extends BaseProcess {
	private readonly url: string;
	private readonly targetDirectory: string;
	private readonly wgetExecutablePath: string;

	constructor(options: WgetProcessOptions) {
		super(options.jobId, options.logger);

		this.url = options.url;
		this.targetDirectory = resolve(options.targetDirectory);
		this.wgetExecutablePath = resolve(options.wgetExecutablePath);

		// Validate wget executable exists
		if (!pathExistsSync(this.wgetExecutablePath)) {
			throw new Error(
				`wget executable not found at path: ${this.wgetExecutablePath}`,
			);
		}

		if (statSync(this.wgetExecutablePath).isDirectory()) {
			throw new Error(
				`wget executable path is a directory: ${this.wgetExecutablePath}`,
			);
		}
	}

	/**
	 * Get the expected filename from the URL
	 */
	getExpectedFilename(): string {
		return basename(this.url);
	}

	/**
	 * Execute the wget process with continuation support
	 */
	protected async executeProcess(
		onProgress: (progress: ProcessProgress) => void,
	): Promise<ProcessResult> {
		// Build wget arguments with continuation flag
		const args = [
			"--progress=bar:force:giga", // Progress bar format
			"--show-progress", // Show progress
			"-c", // Continue partial downloads (CRITICAL for resumability)
			"--no-clobber", // Don't overwrite existing files
			this.url,
		];

		this.logger.debug(
			{ jobId: this.jobId, url: this.url, args },
			"Starting wget process",
		);

		// Spawn the wget process
		this.process = spawn(this.wgetExecutablePath, args, {
			stdio: "pipe",
			cwd: this.targetDirectory,
		});

		const pid = this.process.pid;
		this.logger.info(
			{ jobId: this.jobId, pid, url: this.url },
			"Wget process spawned",
		);

		// Initial progress
		onProgress({ progress: 0 });

		return new Promise((resolve, reject) => {
			if (!this.process) {
				return reject(new Error("Process failed to spawn"));
			}

			// Wget writes progress to stderr
			this.process.stderr?.on("data", (data) => {
				if (!data) return;

				const summary = data
					.toString()
					.replace("wget.exe", "")
					.replace(/\[=+>+]/, "")
					.replace(/\s+/g, " ")
					.trim();

				const progress = extractPercentage(summary);
				if (progress !== undefined) {
					onProgress({ progress, summary });
				}
			});

			// Handle process errors
			this.process.on("error", (err) => {
				this.logger.error(
					{ jobId: this.jobId, error: err },
					"Wget process error",
				);
				resolve({
					success: false,
					exitCode: null,
					error: err,
				});
			});

			// Handle process exit
			this.process.on("close", (code) => {
				this.logger.info(
					{ jobId: this.jobId, exitCode: code },
					"Wget process exited",
				);

				if (code === 0) {
					onProgress({ progress: 100 });
					resolve({
						success: true,
						exitCode: code,
					});
				} else {
					const errorMessage = this.getWgetErrorMessage(code);
					resolve({
						success: false,
						exitCode: code,
						error: new Error(
							`Wget failed with exit code ${code}: ${errorMessage}`,
						),
					});
				}
			});
		});
	}

	/**
	 * Get human-readable error message for wget exit codes
	 * https://www.gnu.org/software/wget/manual/html_node/Exit-Status.html
	 */
	private getWgetErrorMessage(code: number | null): string {
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
}
