import { Checkbox, Progress, Table, Text } from "@mantine/core";
import { StatusCodes } from "http-status-codes";
import { useGetLatestModReleaseById } from "../../_autogen/api.ts";
import { type ModAndReleaseData, ModAndReleaseDataStatus } from "../../_autogen/daemon_api.ts";
import { useAppTranslation } from "../../i18n/useAppTranslation.ts";
import { _ModActionsMenu } from "./_ModActionsMenu.tsx";

function canBeToggled(status: ModAndReleaseDataStatus | null | undefined) {
	return status === ModAndReleaseDataStatus.ENABLED || status === ModAndReleaseDataStatus.DISABLED;
}

export type DownloadedModsTableRowProps = {
	mod: ModAndReleaseData;
};
export function _DownloadedModsTableRow(props: DownloadedModsTableRowProps) {
	const { t } = useAppTranslation();
	const latest = useGetLatestModReleaseById(props.mod.modId);
	const isLatest = latest.data?.status === StatusCodes.OK ? latest.data.data.version === props.mod.version : undefined;
	const latestVersion = latest.data?.status === StatusCodes.OK ? latest.data.data.version : undefined;

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
			<Table.Td>{latestVersion}</Table.Td>
			<Table.Td>
				{props.mod.status === ModAndReleaseDataStatus.IN_PROGRESS ? (
					<Progress value={props.mod.overallPercentProgress || 0} striped={true} animated={true} />
				) : (
					t(props.mod.status || "PENDING")
				)}
			</Table.Td>
			<Table.Td>
				<_ModActionsMenu
					mod={props.mod}
					latest={latest.data?.status === StatusCodes.OK ? latest.data?.data : undefined}
				/>
			</Table.Td>
		</Table.Tr>
	);
}
