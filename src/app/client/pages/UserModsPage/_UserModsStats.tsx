import { Group } from "@mantine/core";
import { StatusCodes } from "http-status-codes";
import type { getUserModsResponse } from "../../_autogen/api.ts";
import { StatCard } from "../../components/StatCard.tsx";
import { useAppTranslation } from "../../i18n/useAppTranslation.ts";
import { AppIcons } from "../../icons.ts";

export function _UserModsStats(props: { mods: getUserModsResponse | undefined }) {
	const { t } = useAppTranslation();

	return (
		<Group flex={"auto"}>
			<StatCard
				icon={AppIcons.Mods}
				label={t("PUBLISHED_MODS")}
				value={props.mods?.status === StatusCodes.OK ? props.mods.data.meta.published : "-"}
			/>
			<StatCard
				icon={AppIcons.Downloaded}
				iconColor={"grape"}
				label={t("TOTAL_DOWNLOADS")}
				value={props.mods?.status === StatusCodes.OK ? props.mods.data.meta.totalDownloads : "-"}
			/>
		</Group>
	);
}
