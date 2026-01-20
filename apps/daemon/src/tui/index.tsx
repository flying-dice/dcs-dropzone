import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import type { ZodError } from "zod";
import type { Application } from "../application/Application.ts";
import { App } from "./App.tsx";
import { ErrorApp } from "./ErrorApp.tsx";

export async function startTui(app: Application, onDestroy?: () => void) {
	const renderer = await createCliRenderer({
		consoleOptions: { title: "Dropzone Daemon" },
		onDestroy,
		openConsoleOnError: false,
	});
	createRoot(renderer).render(<App app={app} />);
}

export async function startErrorTui(error: ZodError, onDestroy?: () => void) {
	const renderer = await createCliRenderer({
		consoleOptions: { title: "Dropzone Daemon - Configuration Error" },
		onDestroy,
		openConsoleOnError: false,
	});
	createRoot(renderer).render(<ErrorApp error={error} />);
}
