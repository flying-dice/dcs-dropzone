import { Group } from "@mantine/core";
import { AppIcons, StatCard, useAppTranslation } from "@packages/dzui";
import { useDaemon } from "../../hooks/useDaemon.ts";
import { orDefaultValue } from "../../utils/orDefaultValue.ts";

export function _StatsCards() {
	const { t } = useAppTranslation();
	const { metrics } = useDaemon();

	return (
		<Group>
			<StatCard icon={AppIcons.Mods} label={t("TOTAL_MODS")} value={orDefaultValue(metrics.value?.totalMods, "-")} />
			<StatCard
				icon={AppIcons.Downloaded}
				iconColor={"cyan"}
				label={t("TOTAL_DOWNLOADS")}
				value={orDefaultValue(metrics.value?.totalDownloads, "-")}
			/>
			<StatCard
				icon={AppIcons.Downloaded}
				iconColor={"grape"}
				label={t("DOWNLOADS")}
				value={orDefaultValue(metrics.value?.downloads, "-")}
			/>
			<StatCard
				icon={AppIcons.Enabled}
				iconColor={"green"}
				label={t("ENABLED")}
				value={orDefaultValue(metrics.value?.enabled, "-")}
			/>
			<StatCard
				icon={AppIcons.Updates}
				iconColor={"orange"}
				label={t("UPDATES")}
				value={orDefaultValue(metrics.value?.outdated, "-")}
			/>
		</Group>
	);
}
