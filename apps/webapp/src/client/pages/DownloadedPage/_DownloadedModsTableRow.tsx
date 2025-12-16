import { Checkbox, Progress, Table, Text } from "@mantine/core";
import { match } from "ts-pattern";
import { GetLatestModReleaseById404Error, type ModReleaseData } from "../../_autogen/api.ts";
import { type ModAndReleaseData, ModAndReleaseDataStatus } from "../../_autogen/daemon_api.ts";
import { useAppTranslation } from "../../i18n/useAppTranslation.ts";
import { _ModActionsMenu } from "./_ModActionsMenu.tsx";

function canBeToggled(status: ModAndReleaseDataStatus | null | undefined) {
	return status === ModAndReleaseDataStatus.ENABLED || status === ModAndReleaseDataStatus.DISABLED;
}

export type DownloadedModsTableRowProps = {
	mod: ModAndReleaseData;
	latest: ModReleaseData | undefined;
	latestError?: GetLatestModReleaseById404Error | string;
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
				<_ModActionsMenu mod={props.mod} latest={props.latest ? props.latest : undefined} />
			</Table.Td>
		</Table.Tr>
	);
}
