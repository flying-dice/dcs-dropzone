import { useKeyboard } from "@opentui/react";
import { getLogger } from "log4js";
import { useMemo, useState } from "react";
import { match } from "ts-pattern";
import Application from "../Application.ts";
import disableRelease from "../services/DisableRelease.ts";
import enableRelease from "../services/EnableRelease.ts";
import regenerateMissionScriptingFiles from "../services/RegenerateMissionScriptingFiles.ts";
import removeRelease from "../services/RemoveRelease.ts";
import { clearRecentLoggingEvents, recentLoggingEvent$ } from "../log4js.ts";
import AllDaemonReleases from "../observables/AllDaemonReleases.ts";
import type { ModAndReleaseData } from "../schemas/ModAndReleaseData.ts";
import { Footer } from "./Footer.tsx";
import { Header } from "./Header.tsx";
import { keyPressedEvents } from "./KeyPressedEvents.ts";
import { ModAndReleaseDataBox } from "./ModAndReleaseDataBox.tsx";
import { ModAndReleaseDataBoxSkeleton } from "./ModAndReleaseDataBoxSkeleton.tsx";
import { Navbar } from "./Navbar.tsx";
import { RecentLoggingEvents } from "./RecentLoggingEvents.tsx";
import { useObservable } from "./useObservable.ts";
import { getNext, getPrevious } from "./utils.ts";

const logger = getLogger("tui");

export function App() {
	const _recentLoggingEvents = useObservable(recentLoggingEvent$, recentLoggingEvent$.value);

	const _releases = useObservable(AllDaemonReleases.$, AllDaemonReleases.$.value);
	const [selectedId, setSelectedId] = useState<string | null>(_releases[0]?.releaseId || null);

	const selected: ModAndReleaseData | undefined = useMemo(
		() => _releases.find((r) => r.releaseId === selectedId),
		[selectedId, _releases],
	);

	const handleDisable = async () => {
		if (!selectedId) return;
		const readableName = `${selected?.modName} v${selected?.version}`;

		try {
			logger.info(`Disabling release: ${readableName}`);
			await disableRelease({
				releaseId: selectedId,
				db: Application.db,
				regenerateMissionScriptFilesHandler: () =>
					regenerateMissionScriptingFiles({ pathService: Application.pathService, db: Application.db }),
			});
			logger.info(`Disabled release: ${readableName}`);
		} catch (err) {
			logger.error(`Error disabling release ${readableName}: ${err}`);
		}
	};

	const handleEnable = async () => {
		if (!selectedId) return;
		const readableName = `${selected?.modName} v${selected?.version}`;
		try {
			logger.info(`Enabling release: ${readableName}`);
			await enableRelease({
				releaseId: selectedId,
				db: Application.db,
				pathService: Application.pathService,
				onCreateSymlink(path: string, dest: string) {
					logger.info("Created symlink", { path, dest });
				},
				regenerateMissionScriptFilesHandler: () =>
					regenerateMissionScriptingFiles({ pathService: Application.pathService, db: Application.db }),
			});
			logger.info(`Enabled release: ${readableName}`);
		} catch (err) {
			logger.error(`Error enabling release ${readableName}`, err);
		}
	};

	const handleRemove = async () => {
		if (!selectedId) return;
		const readableName = `${selected?.modName} v${selected?.version}`;
		try {
			logger.info(`Removing release: ${readableName}`);
			await removeRelease({
				releaseId: selectedId,
				db: Application.db,
				pathService: Application.pathService,
				disableReleaseHandler: (releaseId) =>
					disableRelease({
						releaseId,
						db: Application.db,
						regenerateMissionScriptFilesHandler: () =>
							regenerateMissionScriptingFiles({ pathService: Application.pathService, db: Application.db }),
					}),
				extractQueue: Application.extractQueue,
				downloadQueue: Application.downloadQueue,
			});
			logger.info(`Removed release: ${readableName}`);
		} catch (err) {
			logger.error(`Error removing release ${readableName}: ${err}`);
		}
	};

	useKeyboard(async (event) => {
		if (event.eventType !== "press") return;
		keyPressedEvents.emit(event.name, event);

		switch (event.name) {
			case "e":
			case "E":
				await handleEnable();
				break;
			case "d":
			case "D":
				await handleDisable();
				break;
			case "r":
			case "R":
				await handleRemove();
				break;
			case "up":
				setSelectedId(getPrevious(_releases, selected)?.releaseId || null);
				break;
			case "down":
				setSelectedId(getNext(_releases, selected)?.releaseId || null);
				break;
			case "c":
				clearRecentLoggingEvents();
				break;
			case "escape":
				setSelectedId(null);
				break;
		}
	});

	return (
		<box flexGrow={1}>
			<Header />
			<box flexGrow={1} flexDirection={"column"} justifyContent={"space-between"}>
				<box flexDirection={"row"} flexGrow={1}>
					<Navbar releases={_releases} selected={selected} />
					{match(selected)
						.when(
							(_selected) => _selected !== undefined,
							(_selected) => <ModAndReleaseDataBox data={_selected} />,
						)
						.otherwise(() => (
							<ModAndReleaseDataBoxSkeleton />
						))}
				</box>

				<RecentLoggingEvents events={_recentLoggingEvents} />
			</box>
			<Footer />
		</box>
	);
}
