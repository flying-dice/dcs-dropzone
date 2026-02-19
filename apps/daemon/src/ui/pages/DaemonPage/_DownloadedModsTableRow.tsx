import { Checkbox, Progress, Table, Text } from "@mantine/core";
import {
	disableRelease,
	enableRelease,
	type ModAndReleaseData,
	ModAndReleaseDataStatus,
	removeReleaseFromDaemon,
	useGetAllDaemonReleases,
} from "@packages/clients/daemon";
import { ModActionsMenu, showErrorNotification, showSuccessNotification, useAppTranslation } from "@packages/dzui";

function canBeToggled(status: ModAndReleaseDataStatus | null | undefined) {
	return status === ModAndReleaseDataStatus.ENABLED || status === ModAndReleaseDataStatus.DISABLED;
}

export type DownloadedModsTableRowProps = {
	mod: ModAndReleaseData;
};
export function _DownloadedModsTableRow(props: DownloadedModsTableRowProps) {
	const { t } = useAppTranslation();
	const allDaemonReleases = useGetAllDaemonReleases();

	const handleToggle = () =>
		props.mod.status === ModAndReleaseDataStatus.ENABLED
			? disableRelease(props.mod.releaseId)
					.then(() => allDaemonReleases.refetch())
					.then(() => showSuccessNotification(t("MOD_DISABLED_SUCCESS_TITLE"), t("MOD_DISABLED_SUCCESS_DESC")))
					.catch(showErrorNotification)
			: enableRelease(props.mod.releaseId)
					.then(() => allDaemonReleases.refetch())
					.then(() => showSuccessNotification(t("MOD_ENABLED_SUCCESS_TITLE"), t("MOD_ENABLED_SUCCESS_DESC")))
					.catch(showErrorNotification);

	const handleRemove = () =>
		removeReleaseFromDaemon(props.mod.releaseId)
			.then(() => allDaemonReleases.refetch())
			.then(() => {
				showSuccessNotification(t("REMOVE_SUCCESS_TITLE"), t("REMOVE_SUCCESS_DESC"));
			})
			.catch(showErrorNotification);

	return (
		<Table.Tr>
			<Table.Th>
				<Checkbox
					disabled={!canBeToggled(props.mod.status)}
					checked={props.mod.status === ModAndReleaseDataStatus.ENABLED}
				/>
			</Table.Th>
			<Table.Td>
				<Text size={"sm"}>{props.mod.modName}</Text>
			</Table.Td>
			<Table.Td>
				<Text size={"sm"}>{props.mod.version}</Text>
			</Table.Td>
			<Table.Td>
				{props.mod.status === ModAndReleaseDataStatus.IN_PROGRESS ? (
					<Progress value={props.mod.overallPercentProgress || 0} striped={true} animated={true} />
				) : (
					t(props.mod.status || ModAndReleaseDataStatus.PENDING)
				)}
			</Table.Td>
			<Table.Td>
				<ModActionsMenu mod={props.mod} onRemove={handleRemove} onToggle={handleToggle} />
			</Table.Td>
		</Table.Tr>
	);
}
