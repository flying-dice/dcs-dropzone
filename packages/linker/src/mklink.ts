import { existsSync, linkSync, statSync, symlinkSync } from "node:fs";
import { platform } from "node:os";
import { parse } from "node:path";
import { zen } from "@packages/zod/zen";
import { getLogger } from "log4js";
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
 */
async function runPowerShellElevated(psCommand: string): Promise<[number, null] | [undefined, [number, string]]> {
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
		return [undefined, [exitCode, stderr || `PowerShell exited with code ${exitCode}`]];
	}

	return [exitCode, null];
}

/**
 * Creates a *symbolic link* at `linkPath` pointing to `targetPath` using elevation (UAC prompt).
 */
function createSymlinkElevated(
	linkPath: string,
	targetPath: string,
): Promise<[number, null] | [undefined, [number, string]]> {
	const cmd = `
$ErrorActionPreference = 'Stop';
New-Item -ItemType SymbolicLink -Path ${psSingleQuote(linkPath)} -Target ${psSingleQuote(targetPath)} -Force | Out-Null
  `.trim();

	return runPowerShellElevated(cmd);
}

const logger = getLogger("mklink");

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
 * This is the orchestrator that selects the right link strategy for the platform,
 * attempts the operation, and categorises failures into known exit codes.
 *
 * @param {Options} options - The options for creating the link, including `link` and `target` paths.
 * @returns A tuple: `[ExitCodes, null]` on success, or `[undefined, [ExitCodes, string]]` on failure.
 */
export async function mklink(options: Options): Promise<[ExitCodes, null] | [undefined, [ExitCodes, string]]> {
	const isWindows = platform() === "win32";

	const { target, link } = Options.parse(options);

	logger.info("Creating link:");
	logger.info(`  ${link} -> ${target}`);

	if (existsSync(link)) {
		logger.error(`Link path already exists: ${link}`);
		return [undefined, [ExitCodes.LinkExists, `Link path already exists: ${link}`]];
	}

	const targetStat = statSync(target);

	if (!isWindows) {
		console.info("Creating symbolic link.");
		const type = targetStat.isDirectory() ? "dir" : "file";
		try {
			symlinkSync(target, link, type);
			return [ExitCodes.LinkCreated, null];
		} catch (e) {
			logger.error(`Failed to create symbolic link: ${e}`);
			return [undefined, [ExitCodes.LinkCreationFailed, `Failed to create symbolic link: ${e}`]];
		}
	}

	// On Windows, check if the link and target are on different NTFS volumes
	const linkRoot = parse(link).root.toLowerCase();
	const targetRoot = parse(target).root.toLowerCase();

	// If target is a directory, create a junction
	if (targetStat.isDirectory()) {
		console.info("Creating junction for directory.");
		try {
			symlinkSync(target, link, "junction");
			return [ExitCodes.LinkCreated, null];
		} catch (e) {
			logger.error(`Failed to create junction: ${e}`);
			return [undefined, [ExitCodes.LinkCreationFailed, `Failed to create junction: ${e}`]];
		}
	}

	// If on the same volume and target is a file, create a hard link
	if (linkRoot === targetRoot) {
		console.info("Creating hard link.");
		try {
			linkSync(target, link);
			return [ExitCodes.LinkCreated, null];
		} catch (e) {
			logger.error(`Failed to create hard link: ${e}`);
			return [undefined, [ExitCodes.LinkCreationFailed, `Failed to create hard link: ${e}`]];
		}
	}

	// Cross-volume file: create a symbolic link, possibly with elevation
	console.info("Creating symbolic link for file (cross-volume).");
	try {
		symlinkSync(target, link, "file");
		return [ExitCodes.LinkCreated, null];
	} catch (e: any) {
		console.error(e.message);
		if (e?.code === "EPERM") {
			console.info("Creating symbolic link with elevated permissions");
			const [, elevatedErr] = await createSymlinkElevated(link, target);
			if (elevatedErr) {
				logger.error(`Failed to create symbolic link elevated: ${elevatedErr}`);
				return [undefined, [ExitCodes.LinkCreationFailed, `Failed to create symbolic link elevated: ${elevatedErr}`]];
			}
			return [ExitCodes.LinkCreated, null];
		}

		logger.error(`Failed to create symbolic link: ${e}`);
		return [undefined, [ExitCodes.LinkCreationFailed, `Failed to create symbolic link: ${e}`]];
	}
}
