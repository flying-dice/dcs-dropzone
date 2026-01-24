import { platform } from "node:os";
import { delimiter, join } from "node:path";
import { getLogger } from "log4js";
import { err, ok, type Result } from "neverthrow";

const logger = getLogger("openUrl");

export function openUrl(url: string): void {
	asApp(url).match(
		(process) => {
			logger.debug(`Opened ${url} in Edge app mode with PID: ${process.pid}`);
		},
		(error) => {
			logger.error(error);
			asBrowser(url).match(
				(process) => {
					logger.debug(`Opened ${url} in default browser with PID: ${process.pid}`);
				},
				(err) => {
					logger.error("Failed to open URL in browser:", err);
				},
			);
		},
	);
}

function spawnResult(cmd: string[], env: NodeJS.ProcessEnv = process.env): Result<Bun.Subprocess, string> {
	try {
		return ok(
			Bun.spawn(cmd, {
				env: { ...env },
				cwd: process.cwd(),
				stdout: "ignore",
				stderr: "inherit",
			}),
		);
	} catch (error) {
		return err(error instanceof Error ? error.message : String(error));
	}
}

function asBrowser(url: string): Result<Bun.Subprocess, string> {
	const cmd =
		process.platform === "win32"
			? ["cmd", "/c", "start", "", url] // "" is the window title; avoids weird parsing
			: process.platform === "darwin"
				? ["open", url]
				: ["xdg-open", url]; // most Linux desktops

	try {
		return ok(
			Bun.spawn(cmd, {
				env: { ...process.env },
				stdout: "ignore",
				stderr: "inherit",
			}),
		);
	} catch (error) {
		if (error instanceof Error) {
			return err(error.message);
		}
		return err(String(error));
	}
}

function asApp(url: string): Result<Bun.Subprocess, string> {
	const plat = platform();
	const args = [`--app=${url}`, "--no-first-run", "--no-default-browser-check"];

	if (plat === "win32") {
		const localAppData = process.env.LOCALAPPDATA;
		const existingPath = process.env.PATH || "";

		const edgePaths = [
			"C:\\Program Files\\Microsoft\\Edge\\Application",
			"C:\\Program Files (x86)\\Microsoft\\Edge\\Application",
			...(localAppData ? [`${localAppData}\\Microsoft\\Edge\\Application`] : []),
		];

		const env = {
			...process.env,
			PATH: [...edgePaths, existingPath].join(delimiter),
		};
		return spawnResult(["msedge", ...args], env);
	}

	if (plat === "darwin") {
		return spawnResult(["open", "-na", "Microsoft Edge", "--args", ...args]);
	}

	return err(`Unsupported platform for opening URL in app: ${plat}`);
}
