function pickClipboardCmd() {
	switch (process.platform) {
		case "win32":
			// reads from stdin
			return ["cmd", "/c", "clip"];
		case "darwin":
			// reads from stdin
			return ["pbcopy"];
		default: {
			// Linux: prefer Wayland tool if present, then X11 tools
			if (Bun.which("wl-copy")) return ["wl-copy"];
			if (Bun.which("xclip")) return ["xclip", "-selection", "clipboard"];
			if (Bun.which("xsel")) return ["xsel", "--clipboard", "--input"];
			return null;
		}
	}
}

export async function writeClipboard(text: string) {
	const cmd = pickClipboardCmd();
	if (!cmd) throw new Error("No clipboard utility found (need wl-copy, xclip, or xsel).");

	const proc = Bun.spawn(cmd, {
		stdin: "pipe",
		stdout: "ignore",
		stderr: "inherit",
		env: process.env,
	});

	proc.stdin.write(text);
	proc.stdin.end();

	const exitCode = await proc.exited;
	if (exitCode !== 0) throw new Error(`Clipboard command failed (exit ${exitCode})`);
}
