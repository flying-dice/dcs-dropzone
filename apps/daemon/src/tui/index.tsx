import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { App } from "./App.tsx";

export async function startTui(onDestroy?: () => void) {
	const renderer = await createCliRenderer({
		consoleOptions: { title: "Dropzone Daemon" },
		onDestroy,
		openConsoleOnError: false,
	});
	createRoot(renderer).render(<App />);
}
