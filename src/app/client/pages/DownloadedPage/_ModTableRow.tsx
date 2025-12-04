import { ActionIcon, Checkbox, Menu, Progress, Table, Text } from "@mantine/core";
import { BsThreeDotsVertical } from "react-icons/bs";
import { type ModAndReleaseData, ModAndReleaseDataStatus } from "../../_autogen/daemon_api.ts";
import { useAppTranslation } from "../../i18n/useAppTranslation.ts";
import type { LatestVersion } from "./_DownloadedModsTable.tsx";

/**
 * Check if a mod subscription status can be toggled
 *
 * @param status The mod subscription status
 * @returns True if the status can be toggled, false otherwise
 */
function canBeToggled(status: ModAndReleaseDataStatus | undefined) {
	return status === ModAndReleaseDataStatus.ENABLED || status === ModAndReleaseDataStatus.DISABLED;
}

export function _ModTableRow(props: {
	subscription: ModAndReleaseData;
	latest: LatestVersion | undefined;
	isLatest: boolean;
	hasUpdateInProgress: boolean;
	onToggle: () => void;
	onUpdate: () => void;
	onRemove: () => void;
}) {
	const { t } = useAppTranslation();
	const { subscription: sxn, latest, isLatest } = props;

	return (
		<Table.Tr>
			<Table.Th>
				<Checkbox
					disabled={!canBeToggled(sxn.status)}
					checked={sxn.status === ModAndReleaseDataStatus.ENABLED}
					onChange={props.onToggle}
				/>
			</Table.Th>
			<Table.Td>{sxn.modName}</Table.Td>
			<Table.Td>
				<Text size={"sm"} c={isLatest ? "green" : "orange"} fw={isLatest ? "normal" : "bold"}>
					{sxn?.version}
				</Text>
			</Table.Td>
			<Table.Td>{latest?.version}</Table.Td>
			<Table.Td>
				{sxn.status === ModAndReleaseDataStatus.IN_PROGRESS ? (
					<Progress value={sxn.overallPercentProgress || 0} striped={true} animated={true} />
				) : (
					sxn.status || "PENDING"
				)}
			</Table.Td>
			<Table.Td>
				<Menu>
					<Menu.Target>
						<ActionIcon variant={"default"}>
							<BsThreeDotsVertical />
						</ActionIcon>
					</Menu.Target>
					<Menu.Dropdown>
						{!isLatest && latest && (
							<Menu.Item disabled={props.hasUpdateInProgress} onClick={props.onUpdate}>
								{t("UPDATE")}
							</Menu.Item>
						)}
						<Menu.Item disabled={!canBeToggled(sxn.status)} onClick={props.onToggle}>
							{sxn.status === ModAndReleaseDataStatus.ENABLED ? t("DISABLE") : t("ENABLE")}
						</Menu.Item>
						<Menu.Item onClick={props.onRemove}>{t("REMOVE")}</Menu.Item>
					</Menu.Dropdown>
				</Menu>
			</Table.Td>
		</Table.Tr>
	);
}
