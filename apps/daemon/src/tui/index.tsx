import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import type { BaseApplication } from "../application/BaseApplication.ts";
import { App } from "./App.tsx";

export async function startTui(app: BaseApplication, onDestroy?: () => void) {
	const renderer = await createCliRenderer({
		consoleOptions: { title: "Dropzone Daemon" },
		onDestroy,
		openConsoleOnError: false,
	});
	createRoot(renderer).render(<App app={app} />);
}
