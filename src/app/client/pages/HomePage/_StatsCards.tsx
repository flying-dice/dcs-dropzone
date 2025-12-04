import { Group } from "@mantine/core";
import { StatusCodes } from "http-status-codes";
import { match } from "ts-pattern";
import type { getModsResponse } from "../../_autogen/api.ts";
import { StatCard } from "../../components/StatCard.tsx";
import { useAppTranslation } from "../../i18n/useAppTranslation.ts";
import { AppIcons } from "../../icons.ts";
import { orDefaultValue } from "../../utils/orDefaultValue.ts";

export function _StatsCards(props: {
	totalMods: getModsResponse | undefined;
	downloadCount: number | undefined;
	enabledCount: number | undefined;
	outdatedCount: number | undefined;
}) {
	const { t } = useAppTranslation();

	return (
		<Group>
			<StatCard
				icon={AppIcons.Mods}
				label={t("TOTAL_MODS")}
				value={match(props.totalMods)
					.when(
						(res) => res?.status === StatusCodes.OK,
						(res) => (res?.status === StatusCodes.OK ? res.data.page.totalElements : "-"),
					)
					.otherwise(() => "-")}
			/>
			<StatCard
				icon={AppIcons.Downloaded}
				iconColor={"grape"}
				label={t("DOWNLOADS")}
				value={orDefaultValue(props.downloadCount, "-")}
			/>
			<StatCard
				icon={AppIcons.Enabled}
				iconColor={"green"}
				label={t("ENABLED")}
				value={orDefaultValue(props.enabledCount, "-")}
			/>
			<StatCard
				icon={AppIcons.Updates}
				iconColor={"orange"}
				label={t("UPDATES")}
				value={orDefaultValue(props.outdatedCount, "-")}
			/>
		</Group>
	);
}
