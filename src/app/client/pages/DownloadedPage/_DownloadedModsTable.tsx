import { Stack, Table, Text } from "@mantine/core";
import { StatusCodes } from "http-status-codes";
import { sortBy } from "lodash";
import { useAsync } from "react-use";
import { match } from "ts-pattern";
import { getModUpdatesByIds } from "../../_autogen/api.ts";
import { ModAndReleaseDataStatus } from "../../_autogen/daemon_api.ts";
import { EmptyState } from "../../components/EmptyState.tsx";
import { useDaemon } from "../../hooks/useDaemon.ts";
import { useAppTranslation } from "../../i18n/useAppTranslation.ts";
import { AppIcons } from "../../icons.ts";
import { _DownloadedModsTableRow } from "./_DownloadedModsTableRow.tsx";

export type LatestVersion = {
	mod_id: string;
	version: string;
	id: string;
};

export type DownloadedModsTableProps = {
	variant: "downloads" | "enabled" | "updates";
};
export function _DownloadedModsTable(props: DownloadedModsTableProps) {
	const { t } = useAppTranslation();

	const { downloads, downloadsIds } = useDaemon();

	const latestVersions = useAsync(() => getModUpdatesByIds({ modIds: downloadsIds || [] }), [downloadsIds]);

	let _subscriptions = sortBy(downloads, "modName");

	if (props.variant === "enabled") {
		_subscriptions = _subscriptions?.filter((sxn) => sxn.status === ModAndReleaseDataStatus.ENABLED);
	}

	if (props.variant === "updates") {
		_subscriptions = _subscriptions.filter((sxn) => {
			if (latestVersions.value?.status !== StatusCodes.OK) return false;
			const latest = latestVersions.value?.data.find((lv) => lv.mod_id === sxn.modId);
			return latest ? latest.version !== sxn.version : false;
		});
	}

	return (
		<Stack>
			<Text fz={"lg"} fw={"bold"}>
				{t("DOWNLOADED")}
			</Text>
			{match(_subscriptions)
				.when(
					(rows) => rows.length,
					(rows) => (
						<Table>
							<Table.Thead>
								<Table.Tr>
									<Table.Th w={100}>{t("ENABLED")}</Table.Th>
									<Table.Th>{t("MOD_NAME")}</Table.Th>
									<Table.Th>{t("VERSION")}</Table.Th>
									<Table.Th>{t("LATEST")}</Table.Th>
									<Table.Th>{t("STATUS")}</Table.Th>
								</Table.Tr>
							</Table.Thead>
							<Table.Tbody>
								{rows.map((mod) => (
									<_DownloadedModsTableRow key={mod.releaseId} mod={mod} />
								))}
							</Table.Tbody>
						</Table>
					),
				)
				.otherwise(() => (
					<EmptyState
						withoutBorder
						title={t("NO_MODS_DOWNLOADED_TITLE")}
						description={t("NO_MODS_DOWNLOADED_SUBTITLE_DESC")}
						icon={AppIcons.Mods}
					/>
				))}
		</Stack>
	);
}
