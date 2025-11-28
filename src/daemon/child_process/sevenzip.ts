import { spawn } from "node:child_process";
import { statSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathExistsSync } from "fs-extra";
import { getLogger } from "log4js";
import { err, ok, type Result } from "neverthrow";
import { z } from "zod";
import { extractPercentage } from "../functions/extract-percentage.ts";

const logger = getLogger("SevenzipChildProcess");

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

const SpawnSevenzipProps = z
	.object({
		exePath: z.string(),
		archivePath: z.string(),
		targetDir: z.string(),
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
			archivePath: resolve(it.archivePath),
			targetDir: resolve(it.targetDir),
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
			if (!pathExistsSync(it.archivePath)) {
				ctx.addIssue({
					code: "custom",
					message: `Archive path does not exist: ${it.archivePath}`,
				});
			}

			if (statSync(it.archivePath).isDirectory()) {
				ctx.addIssue({
					code: "custom",
					message: `Archive path is a directory: ${it.archivePath}`,
				});
			}
		} catch (e) {
			ctx.addIssue({
				code: "custom",
				message: `Failed to validate archive path: ${it.archivePath} - ${e}`,
			});
		}
	});

export type SpawnSevenzipProps = z.infer<typeof SpawnSevenzipProps>;

/**
 * Result of the sevenzip spawn process
 * - Ok: string - Path to the extracted directory
 * - Err: SevenzipErrors - Error type
 */
export type SevenzipResult = Result<string, SevenzipErrors>;

/**
 * Enum representing possible errors that can occur during the sevenzip process.
 * - PropsError: Error related to invalid properties provided to the sevenzip process.
 * - ProcessError: Error that occurs during the execution of the sevenzip process.
 */
export enum SevenzipErrors {
	/** Error related to invalid properties provided to the sevenzip process. */
	PropsError = "PropsError",

	/** Error that occurs during the execution of the sevenzip process. */
	ProcessError = "ProcessError",
}

/**
 * Spawns a 7zip process to extract an archive.
 *
 * @param props - Properties required to configure and execute the 7zip process.
 * @param abortSignal - Optional AbortSignal to cancel the 7zip process.
 * @returns A promise resolving to a `SevenzipResult` containing either the path to the extracted directory or an error.
 */
export async function spawnSevenzip(
	props: SpawnSevenzipProps,
	abortSignal?: AbortSignal,
): Promise<SevenzipResult> {
	const parsedProps = SpawnSevenzipProps.safeParse(props);

	if (!parsedProps.success) {
		logger.error(`Invalid sevenzip props`, parsedProps.error.issues);
		return err(SevenzipErrors.PropsError);
	}

	const { exePath, archivePath, targetDir, onProgress } = parsedProps.data;

	// Create target directory if it doesn't exist
	await mkdir(targetDir, { recursive: true });

	const args = ["-bso1", "-bsp1", "-y", "x", archivePath, `-o${targetDir}`];

	logger.trace(["\n", exePath, ...args].join(" "));

	return new Promise((resolve, reject) => {
		const _7zip = spawn(exePath, args, {
			stdio: "pipe",
			signal: abortSignal,
		});

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

		_7zip.on("error", (err) => {
			_7zip.removeAllListeners();
			logger.error(`Error in sevenzip: ${err}`);
		});

		_7zip.on("close", (code) => {
			if (code === 0) {
				_7zip.removeAllListeners();
				props.onProgress({ progress: 100 });
				resolve(code);
			} else {
				_7zip.removeAllListeners();
				reject(
					new Error(
						`Failed to extract archive, code: ${code} - ${getSevenzipErrorMessage(code)}`,
					),
				);
			}
		});
	}).then(
		() => {
			logger.info(
				`Sevenzip process completed successfully for archive: ${archivePath}`,
			);
			return ok(targetDir);
		},
		(error) => {
			logger.error(`Sevenzip process error: ${error}`);
			return err(SevenzipErrors.ProcessError);
		},
	);
}
