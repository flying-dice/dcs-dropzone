import { TextAttributes } from "@opentui/core";
import type { LoggingEvent } from "log4js";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useObservable } from "react-use";
import Application from "../Application.ts";
import disableRelease from "../commands/DisableRelease.ts";
import enableRelease from "../commands/EnableRelease.ts";
import { DownloadedReleaseStatus } from "../enums/DownloadedReleaseStatus.ts";
import { recentLoggingEvent$ } from "../log4js.ts";
import getAllDaemonReleases from "../queries/GetAllDaemonReleases.ts";
import type {
	ModAndReleaseData,
	ModReleaseAssetData,
	ModReleaseMissionScriptData,
	ModReleaseSymbolicLinkData,
} from "../schemas/ModAndReleaseData.ts";

type ButtonProps = {
	active?: boolean;
	onClick: () => void;
	children: ReactNode;
	flexGrow?: number;
};
function Button({ active, children, onClick, flexGrow }: ButtonProps) {
	const [hovered, setHovered] = useState(false);

	return (
		<box
			border
			borderColor={"gray"}
			paddingX={1}
			paddingY={0}
			onMouseDown={onClick}
			onMouseOver={() => setHovered(true)}
			onMouseOut={() => setHovered(false)}
			backgroundColor={active ? "#f59e0f" : hovered ? "#f1c071" : undefined}
			flexGrow={flexGrow}
		>
			{children}
		</box>
	);
}

function KeyValueItem({ label, value }: { label: string; value: string }) {
	return (
		<box flexDirection={"row"} gap={1}>
			<text attributes={TextAttributes.DIM}>{label}:</text>
			<text>{value}</text>
		</box>
	);
}

type LoggingEventItemProps = {
	event: LoggingEvent;
};
function LoggingEventItem({ event }: LoggingEventItemProps) {
	return (
		<box flexDirection={"row"} gap={1}>
			<text attributes={TextAttributes.DIM}>[{event.startTime.toLocaleString()}]</text>
			<text>[{event.level.levelStr}]</text>
			<text>[{event.categoryName}]</text>
			<text>{event.data.map((it) => (typeof it === "object" ? JSON.stringify(it) : it)).join(" ")}</text>
		</box>
	);
}

function toPercentOrDash(value: number | undefined): string {
	if (value === undefined) return "-";
	return `${value.toFixed(0)}%`;
}

function ModReleaseMissionScriptDataBox({ script }: { script: ModReleaseMissionScriptData }) {
	return (
		<box title={script.name} flexDirection={"column"} borderStyle={"rounded"} borderColor={"gray"}>
			<KeyValueItem label={"Purpose"} value={script.purpose} />
			<KeyValueItem label={"Path"} value={script.path} />
			<KeyValueItem label={"Root"} value={script.root} />
			<KeyValueItem label={"Run On"} value={script.runOn} />
		</box>
	);
}

function ModReleaseSymbolicLinkDataBox({ link }: { link: ModReleaseSymbolicLinkData }) {
	return (
		<box title={link.name} flexDirection={"column"} borderStyle={"rounded"} borderColor={"gray"}>
			<KeyValueItem label={"Source"} value={link.src} />
			<KeyValueItem label={"Destination"} value={link.dest} />
			<KeyValueItem label={"Destination Root"} value={link.destRoot} />
		</box>
	);
}

function ModReleaseAssetDataBox({ asset }: { asset: ModReleaseAssetData }) {
	const downloadProgress = toPercentOrDash(asset.statusData?.downloadPercentProgress);
	const extractProgress = toPercentOrDash(asset.statusData?.extractPercentProgress);

	return (
		<box title={asset.name} flexDirection={"column"} borderStyle={"rounded"} borderColor={"gray"}>
			<KeyValueItem label={"Download Progress"} value={downloadProgress} />
			<KeyValueItem label={"Extract Progress"} value={asset.isArchive ? extractProgress : "N/A"} />
			<KeyValueItem label={"Status"} value={asset.statusData?.status || "-"} />

			<box flexDirection={"column"}>
				<text attributes={TextAttributes.DIM}>URLs:</text>
				{asset.urls.map((url) => (
					<text key={url} marginLeft={2} attributes={TextAttributes.ITALIC}>
						- {url}
					</text>
				))}
			</box>
		</box>
	);
}

function ModAndReleaseDataBox({ data }: { data: ModAndReleaseData }) {
	const handleDisable = () => {
		disableRelease({
			releaseId: data.releaseId,
			db: Application.db,
		});
	};

	const handleEnable = () => {
		enableRelease({
			releaseId: data.releaseId,
			db: Application.db,
			pathService: Application.pathService,
		});
	};

	return (
		<box flexDirection={"column"} borderStyle={"single"} title={`${data.modName} v${data.version}`} padding={1} gap={1}>
			<scrollbox>
				<box flexGrow={1}>
					<KeyValueItem label={"Mod Name"} value={data.modName} />
					<KeyValueItem label={"Version"} value={data.version} />
					<KeyValueItem label={"Status"} value={data.status || "-"} />
					<box flexDirection={"column"}>
						<text attributes={TextAttributes.DIM}>Assets:</text>
						{data.assets.map((asset) => (
							<ModReleaseAssetDataBox key={asset.name} asset={asset} />
						))}
					</box>
					<box flexDirection={"column"}>
						<text attributes={TextAttributes.DIM}>Symbolic Links:</text>
						{data.symbolicLinks.map((link) => (
							<ModReleaseSymbolicLinkDataBox key={link.name} link={link} />
						))}
					</box>
					<box flexDirection={"column"}>
						<text attributes={TextAttributes.DIM}>Mission Scripts:</text>
						{data.missionScripts.map((script) => (
							<ModReleaseMissionScriptDataBox key={script.name} script={script} />
						))}
					</box>
					<box>
						<text>Actions:</text>
						<box flexDirection={"row"}>
							<Button onClick={handleEnable} active={data.status === DownloadedReleaseStatus.ENABLED} flexGrow={1}>
								<text>Enable</text>
							</Button>
							<Button onClick={handleDisable} active={data.status === DownloadedReleaseStatus.DISABLED} flexGrow={1}>
								<text>Disable</text>
							</Button>
						</box>
					</box>
				</box>
			</scrollbox>
		</box>
	);
}

export function App() {
	const _recentLoggingEvents = useObservable(recentLoggingEvent$, recentLoggingEvent$.value);

	const [releases, setReleases] = useState(getAllDaemonReleases({ db: Application.db }));

	useEffect(() => {
		const interval = setInterval(async () => {
			const updatedReleases = getAllDaemonReleases({ db: Application.db });
			setReleases(updatedReleases);
		}, 500);

		return () => clearInterval(interval);
	}, []);

	const [selectedId, setSelectedId] = useState<string | null>(releases[0]?.releaseId || null);

	const selected: ModAndReleaseData | undefined = useMemo(() => {
		return releases.find((r) => r.releaseId === selectedId) || null;
	}, [selectedId, releases]);

	return (
		<box flexGrow={1}>
			{/*<ascii-font font="slick" text="Dropzone" margin={1} color={"#f59e0f"} />*/}
			<box flexGrow={1} flexDirection={"column"}>
				<box flexDirection={"row"}>
					<box width={"20%"} border title={"Mods"}>
						{releases.map((release) => (
							<Button
								key={release.releaseId + release.overallPercentProgress + release.status}
								onClick={() => setSelectedId(release.releaseId)}
								active={selected?.releaseId === release.releaseId}
							>
								<text>
									{release.modName} v{release.version}
								</text>
								<text attributes={TextAttributes.DIM}>{release.status || "-"}</text>
							</Button>
						))}
					</box>
					<box width={"80%"}>{selected && <ModAndReleaseDataBox data={selected} />}</box>
				</box>

				<box borderStyle={"single"} title={"Logs"}>
					<scrollbox overflow={"scroll"} scrollX scrollY>
						{_recentLoggingEvents.map((event) => (
							<LoggingEventItem key={event.id} event={event} />
						))}
					</scrollbox>
				</box>
			</box>
		</box>
	);
}
