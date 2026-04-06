import { Group } from "@mantine/core";
import { useGetUserMods } from "@packages/clients/webapp";
import { AppIcons, StatCard, useAppTranslation } from "@packages/dzui";
import { USER_MODS_PUBLISHED_MODS_TEST_ID, USER_MODS_TOTAL_DOWNLOADS_TEST_ID } from "@packages/testids";
import { StatusCodes } from "http-status-codes";

export function _UserModsStats() {
	const { t } = useAppTranslation();
	const mods = useGetUserMods();

	return (
		<Group flex={"auto"}>
			<StatCard
				data-testid={USER_MODS_PUBLISHED_MODS_TEST_ID}
				icon={AppIcons.Mods}
				label={t("PUBLISHED_MODS")}
				value={mods.data?.status === StatusCodes.OK ? mods.data.data.meta.published : "-"}
			/>
			<StatCard
				data-testid={USER_MODS_TOTAL_DOWNLOADS_TEST_ID}
				icon={AppIcons.Downloaded}
				iconColor={"grape"}
				label={t("TOTAL_DOWNLOADS")}
				value={mods.data?.status === StatusCodes.OK ? mods.data.data.meta.totalDownloads : "-"}
			/>
		</Group>
	);
}
