import { TextAttributes } from "@opentui/core";
import { match } from "ts-pattern";
import { DownloadedReleaseStatus } from "../application/enums/DownloadedReleaseStatus.ts";
import type { ModAndReleaseData } from "../application/schemas/ModAndReleaseData.ts";
import { Group, Stack } from "./components.tsx";
import { DownloadedReleaseStatusLabel } from "./DownloadedReleaseStatusLabel.tsx";
import { ModReleaseAssetDataBox } from "./ModReleaseAssetDataBox.tsx";
import { ModReleaseMissionScriptDataBox } from "./ModReleaseMissionScriptDataBox.tsx";
import { ModReleaseSymbolicLinkDataBox } from "./ModReleaseSymbolicLinkDataBox.tsx";

function _ActionsBox(props: { status: DownloadedReleaseStatus }) {
	return (
		<box gap={1} flexDirection={"row"}>
			<text attributes={TextAttributes.BOLD}>ACTIONS:</text>
			{match(props.status)
				.when(
					(it) => it === DownloadedReleaseStatus.ENABLED,
					() => <text>[D] Disable | [R] Remove</text>,
				)
				.when(
					(it) => it === DownloadedReleaseStatus.DISABLED,
					() => <text>[E] Enable | [R] Remove</text>,
				)
				.otherwise(() => (
					<text>[R] Remove</text>
				))}
		</box>
	);
}

function _StatusBox(props: { status: DownloadedReleaseStatus }) {
	return (
		<box gap={1} flexDirection={"row"}>
			<text attributes={TextAttributes.BOLD}>STATUS:</text>
			<DownloadedReleaseStatusLabel status={props.status} />
		</box>
	);
}

export type ModAndReleaseDataBoxProps = { data: ModAndReleaseData };
export function ModAndReleaseDataBox(props: ModAndReleaseDataBoxProps) {
	return (
		<box padding={1} flexDirection={"column"} border={["left"]} title={`${props.data.modName} v${props.data.version}`}>
			<scrollbox>
				<Stack>
					<Group>
						<text attributes={TextAttributes.BOLD}>{props.data.modName}</text>
						<text>{props.data.version}</text>
					</Group>

					<Stack gap={0}>
						<_StatusBox status={props.data.status || DownloadedReleaseStatus.PENDING} />
						<_ActionsBox status={props.data.status || DownloadedReleaseStatus.PENDING} />
					</Stack>

					<box title={"ASSETS"} border={["top"]}>
						{match(props.data.assets)
							.when(
								(assets) => assets.length === 0,
								() => (
									<text marginLeft={2} attributes={TextAttributes.ITALIC} fg={"gray"}>
										No assets configured.
									</text>
								),
							)
							.otherwise((assets) => (
								<Stack>
									{assets.map((asset) => (
										<ModReleaseAssetDataBox key={asset.name} asset={asset} />
									))}
								</Stack>
							))}
					</box>

					<box title={"SYMBOLIC LINKS"} border={["top"]}>
						{match(props.data.symbolicLinks)
							.when(
								(links) => links.length === 0,
								() => (
									<text marginLeft={2} attributes={TextAttributes.ITALIC} fg={"gray"}>
										No symbolic links configured.
									</text>
								),
							)
							.otherwise((links) => (
								<Stack>
									{links.map((link) => (
										<ModReleaseSymbolicLinkDataBox key={link.name} link={link} />
									))}
								</Stack>
							))}
					</box>

					<box title={"MISSION SCRIPTS"} border={["top"]}>
						{match(props.data.missionScripts)
							.when(
								(scripts) => scripts.length === 0,
								() => (
									<text marginLeft={2} attributes={TextAttributes.ITALIC} fg={"gray"}>
										No mission scripts configured.
									</text>
								),
							)
							.otherwise((scripts) => (
								<Stack>
									{scripts.map((script) => (
										<ModReleaseMissionScriptDataBox key={script.name} script={script} />
									))}
								</Stack>
							))}
					</box>
				</Stack>
			</scrollbox>
		</box>
	);
}
