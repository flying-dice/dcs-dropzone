import { Group } from "@mantine/core";
import { StatCard } from "../../components/StatCard.tsx";
import { useAppTranslation } from "../../i18n/useAppTranslation.ts";
import { AppIcons } from "../../icons.ts";
import { orDefaultValue } from "../../utils/orDefaultValue.ts";

export function _StatsCards(props: { downloadCount: number; enabledCount: number; outdatedCount: number }) {
	const { t } = useAppTranslation();

	return (
		<Group>
			<StatCard
				icon={AppIcons.Downloaded}
				iconColor={"grape"}
				label={t("DOWNLOADED")}
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
