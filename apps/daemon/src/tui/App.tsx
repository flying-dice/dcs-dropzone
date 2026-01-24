import { useKeyboard, useRenderer } from "@opentui/react";
import { compact } from "lodash";
import { useMemo, useState } from "react";
import type { BehaviorSubject, Observable } from "rxjs";
import { match } from "ts-pattern";
import type { ModAndReleaseData } from "../application/schemas/ModAndReleaseData.ts";
import type { RecentLoggingEvent } from "../log4js.ts";
import { writeClipboard } from "../utils/writeClipboard.ts";
import { ErrorModal } from "./ErrorModal.tsx";
import { Footer } from "./Footer.tsx";
import { Header } from "./Header.tsx";
import { keyPressedEvents } from "./KeyPressedEvents.ts";
import { ModAndReleaseDataBox } from "./ModAndReleaseDataBox.tsx";
import { ModAndReleaseDataBoxSkeleton } from "./ModAndReleaseDataBoxSkeleton.tsx";
import { Navbar } from "./Navbar.tsx";
import { RecentLoggingEvents } from "./RecentLoggingEvents.tsx";
import { useObservable } from "./useObservable.ts";
import { getNext, getPrevious } from "./utils.ts";

export type AppProps = {
	onOpenBrowser: () => void;
	onDisableRelease: (releaseId: string) => void;
	onEnableRelease: (releaseId: string) => void;
	onRemoveRelease: (releaseId: string) => void;
	onQuit: () => void;
	recentLoggingEvent$: BehaviorSubject<RecentLoggingEvent[]>;
	release$: Observable<ModAndReleaseData[]>;
};
export function App(props: AppProps) {
	const renderer = useRenderer();
	const recentLoggingEvents = useObservable(props.recentLoggingEvent$, props.recentLoggingEvent$.value);

	const releases = useObservable(props.release$, []);
	const [selectedId, setSelectedId] = useState<string | null>(releases[0]?.releaseId || null);

	const selected: ModAndReleaseData | undefined = useMemo(
		() => releases.find((r) => r.releaseId === selectedId),
		[selectedId, releases],
	);

	const [error, setError] = useState<Error | undefined>(undefined);

	const instructions = compact([
		"L: Open Library",
		"↑/↓: Navigate Mods",
		"Q: Quit",
		"CTRL+C: Copy Selection",
		selected ? (selected.status === "ENABLED" ? "D: Disable" : "E: Enable") : undefined,
		selected ? "R: Remove Mod" : undefined,
		selected ? "Esc: Deselect" : undefined,
	]);

	useKeyboard(async (event) => {
		if (event.eventType !== "press") return;
		keyPressedEvents.emit(event.name, event);

		let eventName = event.name.toLowerCase();

		if (event.ctrl && event.name.length === 1) {
			eventName = `ctrl+${event.name.toLowerCase()}`;
		}

		if (event.shift && event.name.length === 1) {
			eventName = `shift+${event.name.toLowerCase()}`;
		}

		if (event.meta && event.name.length === 1) {
			eventName = `alt+${event.name.toLowerCase()}`;
		}

		if (event.option && event.name.length === 1) {
			eventName = `opt+${event.name.toLowerCase()}`;
		}

		try {
			switch (eventName) {
				case "e":
					selectedId && props.onEnableRelease(selectedId);
					break;
				case "d":
					selectedId && props.onDisableRelease(selectedId);
					break;
				case "r":
					selectedId && props.onRemoveRelease(selectedId);
					break;
				case "up":
					setSelectedId(getPrevious(releases, selected)?.releaseId || null);
					break;
				case "down":
					setSelectedId(getNext(releases, selected)?.releaseId || null);
					break;
				case "l":
					props.onOpenBrowser();
					break;
				case "q":
					props.onQuit();
					break;
				case "escape":
					setError(undefined);
					setSelectedId(null);
					break;
				case "ctrl+c": {
					const selection = renderer.getSelection()?.getSelectedText();
					selection && (await writeClipboard(selection));
					break;
				}
			}
		} catch (error) {
			setError(error instanceof Error ? error : new Error("An unknown error occurred"));
		}
	});

	return (
		<box flexGrow={1}>
			<Header />
			<box flexGrow={1} flexDirection={"column"} justifyContent={"space-between"}>
				<box flexDirection={"row"} flexGrow={1}>
					<Navbar releases={releases} selected={selected} />
					{match(selected)
						.when(
							(_selected) => _selected !== undefined,
							(_selected) => <ModAndReleaseDataBox data={_selected} />,
						)
						.otherwise(() => (
							<ModAndReleaseDataBoxSkeleton />
						))}
				</box>

				<RecentLoggingEvents events={recentLoggingEvents} />
			</box>
			<Footer instructions={instructions} />
			{error && <ErrorModal error={error} onClose={() => setError(undefined)} />}
		</box>
	);
}
