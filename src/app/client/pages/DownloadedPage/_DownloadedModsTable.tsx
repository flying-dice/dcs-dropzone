import { Stack, Table, Text } from "@mantine/core";
import { match } from "ts-pattern";
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

	const { downloads } = useDaemon();

	return (
		<Stack>
			<Text fz={"lg"} fw={"bold"}>
				{t("DOWNLOADED")}
			</Text>
			{match(downloads || [])
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
									<_DownloadedModsTableRow key={mod.releaseId} mod={mod} variant={props.variant} />
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
