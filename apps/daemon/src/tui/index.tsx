import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { App, type AppProps } from "./App.tsx";

export async function startTui(props: AppProps) {
	const renderer = await createCliRenderer({
		consoleOptions: { title: "Dropzone Daemon" },
		exitOnCtrlC: false,
		openConsoleOnError: false,
	});

	createRoot(renderer).render(
		<App
			{...props}
			onQuit={() => {
				renderer.stop();
				renderer.destroy();
				props.onQuit();
			}}
		/>,
	);
}
