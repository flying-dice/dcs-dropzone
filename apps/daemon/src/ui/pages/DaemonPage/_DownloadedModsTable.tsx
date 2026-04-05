import { Stack, Table, Text } from "@mantine/core";
import type { ModAndReleaseData } from "@packages/clients/daemon";
import { AppIcons, EmptyState, useAppTranslation } from "@packages/dzui";
import { match } from "ts-pattern";
import { _DownloadedModsTableRow } from "./_DownloadedModsTableRow.tsx";

export type DownloadedModsTableProps = {
	mods: ModAndReleaseData[];
};
export function _DownloadedModsTable(props: DownloadedModsTableProps) {
	const { t } = useAppTranslation();

	const title = t("DOWNLOADED");
	const emptyTitle = t("NO_MODS_DOWNLOADED_TITLE");
	const emptyDescription = t("NO_MODS_DOWNLOADED_SUBTITLE_DESC");

	return (
		<Stack>
			<Text fz={"lg"} fw={"bold"}>
				{title}
			</Text>
			{match(props.mods)
				.when(
					(rows) => rows.length,
					(rows) => (
						<Table>
							<Table.Thead>
								<Table.Tr>
									<Table.Th w={100}>{t("ENABLED")}</Table.Th>
									<Table.Th>{t("MOD_NAME")}</Table.Th>
									<Table.Th>{t("VERSION")}</Table.Th>
									<Table.Th>{t("STATUS")}</Table.Th>
								</Table.Tr>
							</Table.Thead>
							<Table.Tbody>
								{rows.map((it) => (
									<_DownloadedModsTableRow key={it.releaseId} mod={it} />
								))}
							</Table.Tbody>
						</Table>
					),
				)
				.otherwise(() => (
					<EmptyState withoutBorder title={emptyTitle} description={emptyDescription} icon={AppIcons.Mods} />
				))}
		</Stack>
	);
}
