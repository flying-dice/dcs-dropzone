import { Group } from "@mantine/core";
import { StatusCodes } from "http-status-codes";
import { useGetUserMods } from "../../_autogen/api.ts";
import { StatCard } from "../../components/StatCard.tsx";
import { useAppTranslation } from "../../i18n/useAppTranslation.ts";
import { AppIcons } from "../../icons.ts";

export function _UserModsStats() {
	const { t } = useAppTranslation();
	const mods = useGetUserMods();

	return (
		<Group flex={"auto"}>
			<StatCard
				icon={AppIcons.Mods}
				label={t("PUBLISHED_MODS")}
				value={mods.data?.status === StatusCodes.OK ? mods.data.data.meta.published : "-"}
			/>
			<StatCard
				icon={AppIcons.Downloaded}
				iconColor={"grape"}
				label={t("TOTAL_DOWNLOADS")}
				value={mods.data?.status === StatusCodes.OK ? mods.data.data.meta.totalDownloads : "-"}
			/>
		</Group>
	);
}
