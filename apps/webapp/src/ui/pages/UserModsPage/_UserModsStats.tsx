import { Group } from "@mantine/core";
import { useGetUserMods } from "@packages/clients/webapp";
import { AppIcons, StatCard, useAppTranslation } from "@packages/dzui";
import { StatusCodes } from "http-status-codes";

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
