import { Group } from "@mantine/core";
import { AppIcons, StatCard, useAppTranslation } from "@packages/dzui";
import {
	STAT_CARD_DOWNLOADS_TEST_ID,
	STAT_CARD_ENABLED_TEST_ID,
	STAT_CARD_TOTAL_DOWNLOADS_TEST_ID,
	STAT_CARD_TOTAL_MODS_TEST_ID,
	STAT_CARD_UPDATES_TEST_ID,
} from "@packages/testids";
import { useDaemon } from "../../hooks/useDaemon.ts";
import { orDefaultValue } from "../../utils/orDefaultValue.ts";

export function _StatsCards() {
	const { t } = useAppTranslation();
	const { metrics } = useDaemon();

	return (
		<Group>
			<StatCard
				icon={AppIcons.Mods}
				label={t("TOTAL_MODS")}
				value={orDefaultValue(metrics.value?.totalMods, "-")}
				data-testid={STAT_CARD_TOTAL_MODS_TEST_ID}
			/>
			<StatCard
				icon={AppIcons.Downloaded}
				iconColor={"cyan"}
				label={t("TOTAL_DOWNLOADS")}
				value={orDefaultValue(metrics.value?.totalDownloads, "-")}
				data-testid={STAT_CARD_TOTAL_DOWNLOADS_TEST_ID}
			/>
			<StatCard
				icon={AppIcons.Downloaded}
				iconColor={"grape"}
				label={t("DOWNLOADS")}
				value={orDefaultValue(metrics.value?.downloads, "-")}
				data-testid={STAT_CARD_DOWNLOADS_TEST_ID}
			/>
			<StatCard
				icon={AppIcons.Enabled}
				iconColor={"green"}
				label={t("ENABLED")}
				value={orDefaultValue(metrics.value?.enabled, "-")}
				data-testid={STAT_CARD_ENABLED_TEST_ID}
			/>
			<StatCard
				icon={AppIcons.Updates}
				iconColor={"orange"}
				label={t("UPDATES")}
				value={orDefaultValue(metrics.value?.outdated, "-")}
				data-testid={STAT_CARD_UPDATES_TEST_ID}
			/>
		</Group>
	);
}
