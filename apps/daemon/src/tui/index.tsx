import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { App } from "./App.tsx";

const renderer = await createCliRenderer({ consoleOptions: { title: "Dropzone Daemon" }, exitOnCtrlC: true });
createRoot(renderer).render(<App />);
