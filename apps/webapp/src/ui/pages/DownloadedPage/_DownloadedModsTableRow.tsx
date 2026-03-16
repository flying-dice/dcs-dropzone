import { Anchor, Checkbox, Progress, Table, Text, Tooltip } from "@mantine/core";
import { openModal } from "@mantine/modals";
import { type ModAndReleaseData, ModAndReleaseDataStatus } from "@packages/clients/daemon";
import { GetLatestModReleaseById404Error, type ModReleaseData } from "@packages/clients/webapp";
import { DownloadedModInformation, ModActionsMenu, useAppTranslation } from "@packages/dzui";
import { useNavigate } from "react-router-dom";
import { match } from "ts-pattern";
import { useDaemon } from "../../hooks/useDaemon.ts";

function canBeToggled(status: ModAndReleaseDataStatus | null | undefined) {
	return status === ModAndReleaseDataStatus.ENABLED || status === ModAndReleaseDataStatus.DISABLED;
}

export type DownloadedModsTableRowProps = {
	mod: ModAndReleaseData;
	latest: ModReleaseData | undefined;
	latestError?: GetLatestModReleaseById404Error | string;
};
export function _DownloadedModsTableRow(props: DownloadedModsTableRowProps) {
	const nav = useNavigate();
	const { t } = useAppTranslation();
	const { toggle, update, remove } = useDaemon();
	const handleToggle = () => toggle(props.mod.releaseId);

	const latest = props.latest;
	const isLatest = latest ? latest.versionHash === props.mod.versionHash : undefined;
	const handleUpdate = latest ? () => update(false, props.mod.modId, props.mod.releaseId, latest.id) : undefined;
	const handleRemove = () => remove(props.mod.releaseId);

	function handleShowSymlinks() {
		openModal({
			size: "xl",
			title: props.mod.modName,
			children: <DownloadedModInformation mod={props.mod} />,
		});
	}

	return (
		<Table.Tr>
			<Table.Th>
				<Checkbox
					disabled={!canBeToggled(props.mod.status)}
					checked={props.mod.status === ModAndReleaseDataStatus.ENABLED}
				/>
			</Table.Th>
			<Table.Td>
				<Anchor
					size={"sm"}
					onClick={(e) => {
						e.preventDefault();
						nav(
							latest === undefined
								? `/user-mods/${props.mod.modId}/releases/${props.mod.releaseId}`
								: `/mods/${props.mod.modId}/${props.mod.releaseId}`,
						);
					}}
				>
					{props.mod.modName}
				</Anchor>
			</Table.Td>
			<Table.Td>
				<Tooltip disabled={isLatest === undefined} label={isLatest ? t("UP_TO_DATE") : t("OUT_OF_DATE")}>
					<Text
						size={"sm"}
						c={isLatest === undefined ? "gray" : isLatest ? "green" : "orange"}
						fw={isLatest ? "normal" : "bold"}
					>
						{props.mod?.version}
					</Text>
				</Tooltip>
			</Table.Td>
			<Table.Td>
				{match(props)
					.when(
						(p) => p.latest?.version,
						(p) => p.latest!.version,
					)
					.when(
						(p) => p.latestError && p.latestError === GetLatestModReleaseById404Error.ModNotFound,
						() => (
							<Text size={"sm"} c={"red"}>
								{t("MOD_NOT_FOUND_ERROR")}
							</Text>
						),
					)
					.when(
						(p) => p.latestError && p.latestError === GetLatestModReleaseById404Error.ReleaseNotFound,
						() => (
							<Text size={"sm"} c={"red"}>
								{t("LATEST_RELEASE_NOT_FOUND_ERROR")}
							</Text>
						),
					)
					.otherwise((p) => (
						<Text size={"sm"} c={"red"}>
							{p.latestError}
						</Text>
					))}
			</Table.Td>
			<Table.Td>
				{props.mod.status === ModAndReleaseDataStatus.IN_PROGRESS ? (
					<Progress value={props.mod.overallPercentProgress || 0} striped={true} animated={true} />
				) : (
					t(props.mod.status || ModAndReleaseDataStatus.PENDING)
				)}
			</Table.Td>
			<Table.Td>
				<ModActionsMenu
					mod={props.mod}
					isLatest={isLatest}
					latest={latest}
					onUpdate={handleUpdate}
					onRemove={handleRemove}
					onToggle={handleToggle}
					onShowSymlinks={handleShowSymlinks}
				/>
			</Table.Td>
		</Table.Tr>
	);
}
