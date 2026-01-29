import { existsSync, linkSync, statSync, symlinkSync } from "node:fs";
import { platform } from "node:os";
import { parse } from "node:path";
import { zen } from "@packages/zod/zen";
import { getLogger } from "log4js";
import { err, fromThrowable, ok, type Result } from "neverthrow";
import { z } from "zod";

/**
 * Escape a string for inclusion inside a single-quoted PowerShell string literal.
 * PowerShell single-quote escape is doubling the quote: ' -> ''
 */
function psSingleQuote(s: string): string {
	return `'${s.replace(/'/g, "''")}'`;
}

/**
 * Runs a PowerShell command elevated (UAC prompt) using Start-Process -Verb RunAs.
 * Returns:
 *   - null on success
 *   - a simple error string on failure
 */
async function runPowerShellElevated(psCommand: string): Promise<Result<number, [number, string]>> {
	const launcher =
		`Start-Process -FilePath "powershell.exe" -Verb RunAs -Wait -PassThru -WindowStyle Hidden -ArgumentList @(
    "-NoProfile",
    "-ExecutionPolicy", "Bypass",
    "-Command", ${psSingleQuote(psCommand)}
  );
  `.trim();

	const proc = Bun.spawn(["powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", launcher], {
		stderr: "pipe",
		stdout: "ignore",
	});

	const [exitCode, stderrBuf] = await Promise.all([proc.exited, new Response(proc.stderr).arrayBuffer()]);

	const stderr = stderrBuf ? Buffer.from(stderrBuf).toString("utf8").trim() : "";

	if (exitCode !== 0) {
		return err([exitCode, stderr || `PowerShell exited with code ${exitCode}`]);
	}

	return ok(exitCode);
}

/**
 * Creates a *symbolic link* at `linkPath` pointing to `targetPath` using elevation (UAC prompt).
 * Returns:
 *   - null on success
 *   - a simple error string on failure
 */
function createSymlinkElevated(linkPath: string, targetPath: string): Promise<Result<number, [number, string]>> {
	const cmd = `
$ErrorActionPreference = 'Stop';
New-Item -ItemType SymbolicLink -Path ${psSingleQuote(linkPath)} -Target ${psSingleQuote(targetPath)} -Force | Out-Null
  `.trim();

	return runPowerShellElevated(cmd);
}

const logger = getLogger("mklink");
const _symlink = fromThrowable(symlinkSync);
const _hardlink = fromThrowable(linkSync);

const Options = z.object({
	link: zen.path({ resolve: true, normalize: true, expandEnvVars: false }),
	target: zen.path({ exists: "check", resolve: true, normalize: true, expandEnvVars: false }),
});

type Options = z.infer<typeof Options>;

enum ExitCodes {
	LinkCreated = 0,
	LinkExists = 1,
	LinkCreationFailed = 2,
}

/**
 * Creates a symbolic or hard link based on the provided options.
 *
 * @param {Options} options - The options for creating the link, including `link` and `target` paths.
 * @returns {Promise<Result<ExitCodes, [ExitCodes, string]>>} - A Result object containing the exit code on success,
 * or an error tuple with the exit code and error message on failure.
 */
export async function mklink(options: Options): Promise<Result<ExitCodes, [ExitCodes, string]>> {
	const isWindows = platform() === "win32";

	const { target, link } = Options.parse(options);

	logger.info("Creating link:");
	logger.info(`  ${link} -> ${target}`);

	if (existsSync(link)) {
		logger.error(`Link path already exists: ${link}`);
		return err([ExitCodes.LinkExists, `Link path already exists: ${link}`]);
	}

	const targetStat = statSync(target);

	if (!isWindows) {
		console.info("Creating symbolic link.");
		const type = targetStat.isDirectory() ? "dir" : "file";
		return _symlink(target, link, type).match(
			(_ok) => ok(ExitCodes.LinkCreated),
			(error) => {
				logger.error(`Failed to create symbolic link: ${error}`);
				return err([ExitCodes.LinkCreationFailed, `Failed to create symbolic link: ${error}`]);
			},
		);
	} else {
		// On Windows, check if the link and target are on different NTFS volumes
		const linkRoot = parse(link).root.toLowerCase();
		const targetRoot = parse(target).root.toLowerCase();

		// If target is a directory, create a junction
		if (targetStat.isDirectory()) {
			console.info("Creating junction for directory.");
			return _symlink(target, link, "junction").match(
				(_ok) => ok(ExitCodes.LinkCreated),
				(error) => {
					logger.error(`Failed to create junction: ${error}`);
					return err([ExitCodes.LinkCreationFailed, `Failed to create junction: ${error}`]);
				},
			);
		}

		// If on the same volume and target is a file, create a hard link
		if (!targetStat.isDirectory() && linkRoot === targetRoot) {
			console.info("Creating hard link.");
			return _hardlink(target, link).match(
				(_ok) => ok(ExitCodes.LinkCreated),
				(error) => {
					logger.error(`Failed to create hard link: ${error}`);
					return err([ExitCodes.LinkCreationFailed, `Failed to create hard link: ${error}`]);
				},
			);
		}

		// If on different volumes and target is a file, create a symbolic link, possibly with elevation
		if (!targetStat.isDirectory() && linkRoot !== targetRoot) {
			console.info("Creating symbolic link for file (cross-volume).");
			return _symlink(target, link, "file").match(
				(_ok) => {
					return ok(ExitCodes.LinkCreated);
				},
				async (e: any) => {
					console.error(e.message);
					if (e?.code === "EPERM") {
						console.info("Creating symbolic link with elevated permissions");
						const res = await createSymlinkElevated(link, target);
						return res.match(
							(_ok) => ok(ExitCodes.LinkCreated),
							(e) => {
								logger.error(`Failed to create symbolic link elevated: ${e}`);
								return err([ExitCodes.LinkCreationFailed, `Failed to create symbolic link elevated: ${e}`]);
							},
						);
					} else {
						logger.error(`Failed to create symbolic link: ${e}`);
						return err([ExitCodes.LinkCreationFailed, `Failed to create symbolic link: ${e}`]);
					}
				},
			);
		}

		return err([
			ExitCodes.LinkCreationFailed,
			`Unsupported link creation scenario for link: ${link} and target: ${target}`,
		]);
	}
}
