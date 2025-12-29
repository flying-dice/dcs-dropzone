import { spawn } from "node:child_process";
import { statSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { mkdirSync, pathExistsSync } from "fs-extra";
import { getLogger } from "log4js";
import { err, ok, type Result } from "neverthrow";
import { z } from "zod";
import { extractPercentage } from "../application/functions/extract-percentage.ts";

const logger = getLogger("WgetChildProcess");

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

const SpawnWgetProps = z
	.object({
		exePath: z.string(),
		target: z.string(),
		url: z.url(),
		onProgress: z.function({
			input: [
				z.object({
					progress: z.number(),
					summary: z.string().optional(),
				}),
			],
			output: z.void(),
		}),
	})
	.transform((it) => {
		return {
			...it,
			exePath: resolve(it.exePath),
			target: resolve(it.target),
		};
	})
	.superRefine((it, ctx) => {
		try {
			if (!pathExistsSync(it.exePath)) {
				ctx.addIssue({
					code: "custom",
					message: `Executable path does not exist: ${it.exePath}`,
				});
			}

			if (statSync(it.exePath).isDirectory()) {
				ctx.addIssue({
					code: "custom",
					message: `Executable path is a directory: ${it.exePath}`,
				});
			}
		} catch (e) {
			ctx.addIssue({
				code: "custom",
				message: `Failed to validate executable path: ${it.exePath} - ${e}`,
			});
		}

		try {
			mkdirSync(it.target, { recursive: true });
		} catch (e) {
			ctx.addIssue({
				code: "custom",
				message: `Failed to create target directory: ${it.target} - ${e}`,
			});
		}
	});

export type SpawnWgetProps = z.infer<typeof SpawnWgetProps>;

/**
 * Result of the wget spawn process
 * - Ok: string - Path to the downloaded file
 * - Err: WgetErrors - Error type
 */
export type WgetResult = Result<string, WgetErrors>;

/**
 * Enum representing possible errors that can occur during the wget process.
 * - PropsError: Error related to invalid properties provided to the wget process.
 * - ProcessError: Error that occurs during the execution of the wget process.
 */
export enum WgetErrors {
	/** Error related to invalid properties provided to the wget process. */
	PropsError = "PropsError",

	/** Error that occurs during the execution of the wget process. */
	ProcessError = "ProcessError",
}

/**
 * Spawns a wget process to download a file from a given URL.
 *
 * @param props - Properties required to configure and getAllReleasesWithStatus the wget process.
 * @param abortSignal - Optional AbortSignal to cancel the wget process.
 * @returns A promise resolving to a `WgetResult` containing either the path to the downloaded file or an error.
 */
export async function spawnWget(props: SpawnWgetProps, abortSignal?: AbortSignal): Promise<WgetResult> {
	const parsedProps = SpawnWgetProps.safeParse(props);

	if (!parsedProps.success) {
		logger.error(`Invalid wget props`, parsedProps.error.issues);
		return err(WgetErrors.PropsError);
	}

	const { exePath, target, url, onProgress } = parsedProps.data;

	const args = ["--progress=bar:force:giga", "--show-progress", "-c", url];

	return new Promise((resolve, reject) => {
		const _wget = spawn(exePath, args, {
			stdio: "pipe",
			cwd: target,
			signal: abortSignal,
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
			logger.error(`Error in wget: ${err}`);
		});

		_wget.on("close", (code) => {
			if (code === 0) {
				_wget.removeAllListeners();
				props.onProgress({ progress: 100 });
				resolve(code);
			} else {
				_wget.removeAllListeners();
				reject(new Error(`Failed to download file, code: ${code} - ${getWgetErrorMessage(code)}`));
			}
		});
	}).then(
		() => {
			logger.info(`Wget process completed successfully for URL: ${url}`);
			return ok(join(target, basename(url)));
		},
		(error) => {
			logger.error(`Wget process error: ${error}`);
			return err(WgetErrors.ProcessError);
		},
	);
}
