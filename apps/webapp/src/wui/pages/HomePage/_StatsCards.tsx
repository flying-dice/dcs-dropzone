import { Group } from "@mantine/core";
import { AppIcons, StatCard, useAppTranslation } from "@packages/dzui";
import { useDashboardMetrics } from "../../hooks/useDashboardMetrics.ts";
import { orDefaultValue } from "../../utils/orDefaultValue.ts";

export function _StatsCards() {
	const { t } = useAppTranslation();
	const { totalMods, totalDownloads, downloads, enabled, outdated } = useDashboardMetrics();

	return (
		<Group>
			<StatCard icon={AppIcons.Mods} label={t("TOTAL_MODS")} value={orDefaultValue(totalMods, "-")} />
			<StatCard
				icon={AppIcons.Downloaded}
				iconColor={"cyan"}
				label={t("TOTAL_DOWNLOADS")}
				value={orDefaultValue(totalDownloads, "-")}
			/>
			<StatCard
				icon={AppIcons.Downloaded}
				iconColor={"grape"}
				label={t("DOWNLOADS")}
				value={orDefaultValue(downloads, "-")}
			/>
			<StatCard icon={AppIcons.Enabled} iconColor={"green"} label={t("ENABLED")} value={orDefaultValue(enabled, "-")} />
			<StatCard
				icon={AppIcons.Updates}
				iconColor={"orange"}
				label={t("UPDATES")}
				value={orDefaultValue(outdated, "-")}
			/>
		</Group>
	);
}
