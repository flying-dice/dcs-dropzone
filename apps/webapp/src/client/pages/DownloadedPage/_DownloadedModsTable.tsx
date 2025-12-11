import { Stack, Table, Text } from "@mantine/core";
import { StatusCodes } from "http-status-codes";
import type { IconType } from "react-icons";
import { useAsync } from "react-use";
import { match } from "ts-pattern";
import { getLatestModReleaseById, type ModReleaseData } from "../../_autogen/api.ts";
import { type ModAndReleaseData, ModAndReleaseDataStatus } from "../../_autogen/daemon_api.ts";
import { EmptyState } from "../../components/EmptyState.tsx";
import { useDaemon } from "../../hooks/useDaemon.ts";
import type { I18nKeys } from "../../i18n/I18nKeys.ts";
import { useAppTranslation } from "../../i18n/useAppTranslation.ts";
import { AppIcons } from "../../icons.ts";
import { _DownloadedModsTableRow } from "./_DownloadedModsTableRow.tsx";

export type Variant = "downloads" | "enabled" | "updates";

const titles: Record<Variant, I18nKeys> = {
	downloads: "DOWNLOADED",
	enabled: "ENABLED",
	updates: "UPDATES",
};

const emptyTitles: Record<Variant, I18nKeys> = {
	downloads: "NO_MODS_DOWNLOADED_TITLE",
	enabled: "NO_ENABLED_MODS_TITLE",
	updates: "NO_OUTDATED_MODS_TITLE",
};

const emptyDescriptions: Record<Variant, I18nKeys> = {
	downloads: "NO_MODS_DOWNLOADED_SUBTITLE_DESC",
	enabled: "NO_ENABLED_MODS_SUBTITLE_DESC",
	updates: "NO_OUTDATED_MODS_SUBTITLE_DESC",
};

const icon: Record<Variant, IconType> = {
	downloads: AppIcons.Mods,
	enabled: AppIcons.Enabled,
	updates: AppIcons.Updates,
};

export type DownloadedModsTableProps = {
	variant: "downloads" | "enabled" | "updates";
};
export function _DownloadedModsTable(props: DownloadedModsTableProps) {
	const { t } = useAppTranslation();

	const { downloads } = useDaemon();

	const hydratedDownloads = useAsync(async () => {
		if (!downloads) return [];

		return Promise.all(
			downloads.map(async (mod): Promise<{ mod: ModAndReleaseData; latest?: ModReleaseData }> => {
				const latest = await getLatestModReleaseById(mod.modId);

				return {
					mod,
					latest: latest?.status === StatusCodes.OK ? latest.data : undefined,
				};
			}),
		);
	}, [downloads]);

	const applicableDownloads = match(props.variant)
		.when(
			(it) => it === "downloads",
			() => hydratedDownloads.value || [],
		)
		.when(
			(it) => it === "enabled",
			() => (hydratedDownloads.value || []).filter((it) => it.mod.status === ModAndReleaseDataStatus.ENABLED),
		)
		.when(
			(it) => it === "updates",
			() => (hydratedDownloads.value || []).filter((it) => it.latest && it.mod.version !== it.latest.version),
		)
		.otherwise(() => hydratedDownloads.value || []);

	const title = t(titles[props.variant]);
	const emptyTitle = t(emptyTitles[props.variant]);
	const emptyDescription = t(emptyDescriptions[props.variant]);

	return (
		<Stack>
			<Text fz={"lg"} fw={"bold"}>
				{title}
			</Text>
			{match(applicableDownloads)
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
								{rows.map((it) => (
									<_DownloadedModsTableRow key={it.mod.releaseId} mod={it.mod} latest={it.latest} />
								))}
							</Table.Tbody>
						</Table>
					),
				)
				.otherwise(() => (
					<EmptyState withoutBorder title={emptyTitle} description={emptyDescription} icon={icon[props.variant]} />
				))}
		</Stack>
	);
}
