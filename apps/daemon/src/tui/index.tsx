import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import type { Application } from "../application/Application.ts";
import { App } from "./App.tsx";

export async function startTui(app: Application, onDestroy?: () => void) {
	const renderer = await createCliRenderer({
		consoleOptions: { title: "Dropzone Daemon" },
		onDestroy,
		openConsoleOnError: false,
	});
	createRoot(renderer).render(<App app={app} />);
}
