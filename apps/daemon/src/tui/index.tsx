import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import type { DisableRelease } from "../services/DisableRelease.ts";
import type { EnableRelease } from "../services/EnableRelease.ts";
import type { RemoveRelease } from "../services/RemoveRelease.ts";
import { App } from "./App.tsx";

export async function startTui(
	deps: {
		enableRelease: EnableRelease;
		disableRelease: DisableRelease;
		removeRelease: RemoveRelease;
	},
	onDestroy?: () => void,
) {
	const renderer = await createCliRenderer({
		consoleOptions: { title: "Dropzone Daemon" },
		onDestroy,
		openConsoleOnError: false,
	});
	createRoot(renderer).render(
		<App enableRelease={deps.enableRelease} disableRelease={deps.disableRelease} removeRelease={deps.removeRelease} />,
	);
}
