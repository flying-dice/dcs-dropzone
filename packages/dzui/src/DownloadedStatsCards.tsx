import { Group } from "@mantine/core";
import { AppIcons } from "./icons.ts";
import { orDefaultValue } from "./orDefaultValue.ts";
import { StatCard } from "./StatCard.tsx";
import { useAppTranslation } from "./useAppTranslation.ts";

export type DownloadedStatsCardsProps = {
	downloaded?: number | string;
	enabled?: number | string;
	updates?: number | string;
	withoutUpdates?: boolean;
};
export function DownloadedStatsCards(props: DownloadedStatsCardsProps) {
	const { t } = useAppTranslation();
	return (
		<Group>
			<StatCard
				icon={AppIcons.Downloaded}
				iconColor={"grape"}
				label={t("DOWNLOADED")}
				value={orDefaultValue(props.downloaded, "-")}
			/>
			<StatCard
				icon={AppIcons.Enabled}
				iconColor={"green"}
				label={t("ENABLED")}
				value={orDefaultValue(props.enabled, "-")}
			/>
			{!props.withoutUpdates && (
				<StatCard
					icon={AppIcons.Updates}
					iconColor={"orange"}
					label={t("UPDATES")}
					value={orDefaultValue(props.updates, "-")}
				/>
			)}
		</Group>
	);
}
