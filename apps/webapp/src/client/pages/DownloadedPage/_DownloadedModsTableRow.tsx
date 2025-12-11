import { Checkbox, Progress, Table, Text } from "@mantine/core";
import type { ModReleaseData } from "../../_autogen/api.ts";
import { type ModAndReleaseData, ModAndReleaseDataStatus } from "../../_autogen/daemon_api.ts";
import { useAppTranslation } from "../../i18n/useAppTranslation.ts";
import { _ModActionsMenu } from "./_ModActionsMenu.tsx";

function canBeToggled(status: ModAndReleaseDataStatus | null | undefined) {
	return status === ModAndReleaseDataStatus.ENABLED || status === ModAndReleaseDataStatus.DISABLED;
}

export type DownloadedModsTableRowProps = {
	mod: ModAndReleaseData;
	latest: ModReleaseData | undefined;
};
export function _DownloadedModsTableRow(props: DownloadedModsTableRowProps) {
	const { t } = useAppTranslation();
	const isLatest = props.latest ? props.mod.version === props.latest.version : undefined;

	return (
		<Table.Tr>
			<Table.Th>
				<Checkbox
					disabled={!canBeToggled(props.mod.status)}
					checked={props.mod.status === ModAndReleaseDataStatus.ENABLED}
				/>
			</Table.Th>
			<Table.Td>{props.mod.modName}</Table.Td>
			<Table.Td>
				<Text size={"sm"} c={isLatest ? "green" : "orange"} fw={isLatest ? "normal" : "bold"}>
					{props.mod?.version}
				</Text>
			</Table.Td>
			<Table.Td>{props.latest?.version || "-"}</Table.Td>
			<Table.Td>
				{props.mod.status === ModAndReleaseDataStatus.IN_PROGRESS ? (
					<Progress value={props.mod.overallPercentProgress || 0} striped={true} animated={true} />
				) : (
					t(props.mod.status || ModAndReleaseDataStatus.PENDING)
				)}
			</Table.Td>
			<Table.Td>
				<_ModActionsMenu mod={props.mod} latest={props.latest ? props.latest : undefined} />
			</Table.Td>
		</Table.Tr>
	);
}
