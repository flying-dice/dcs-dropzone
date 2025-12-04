import { Stack, Table, Text } from "@mantine/core";
import type { getModUpdatesByIdsResponseSuccess } from "../../_autogen/api.ts";
import type { ModAndReleaseData } from "../../_autogen/daemon_api.ts";
import { EmptyState } from "../../components/EmptyState.tsx";
import { useAppTranslation } from "../../i18n/useAppTranslation.ts";
import { AppIcons } from "../../icons.ts";
import { _ModTableRow } from "./_ModTableRow.tsx";

export type LatestVersion = {
	mod_id: string;
	version: string;
	id: string;
};

export function _DownloadedModsTable(props: {
	subscriptions: ModAndReleaseData[];
	latestVersions: getModUpdatesByIdsResponseSuccess | null;
	onToggle: (releaseId: string) => void;
	onUpdate: (modId: string, currentReleaseId: string, latestReleaseId: string) => void;
	onRemove: (releaseId: string) => void;
}) {
	const { t } = useAppTranslation();

	const rows = props.subscriptions?.map((sxn) => {
		const latest = props.latestVersions?.data.find((lv) => lv.mod_id === sxn.modId);
		const isLatest = latest ? latest.version === sxn.version : true;

		return (
			<_ModTableRow
				key={sxn.modId}
				subscription={sxn}
				latest={latest}
				isLatest={isLatest}
				hasUpdateInProgress={props.subscriptions.some((it) => it.releaseId !== latest?.id)}
				onToggle={() => props.onToggle(sxn.releaseId)}
				onUpdate={() => latest && props.onUpdate(sxn.modId, sxn.releaseId, latest.id)}
				onRemove={() => props.onRemove(sxn.releaseId)}
			/>
		);
	});

	return (
		<Stack>
			<Text fz={"lg"} fw={"bold"}>
				{t("DOWNLOADED")}
			</Text>
			{props.subscriptions?.length ? (
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
					<Table.Tbody>{rows}</Table.Tbody>
				</Table>
			) : (
				<EmptyState
					withoutBorder
					title={t("NO_MODS_DOWNLOADED_TITLE")}
					description={t("NO_MODS_DOWNLOADED_SUBTITLE_DESC")}
					icon={AppIcons.Mods}
				/>
			)}
		</Stack>
	);
}
