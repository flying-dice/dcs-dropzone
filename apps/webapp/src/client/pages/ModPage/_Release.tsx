import { Alert, Badge, Group, type MantineColor, Text } from "@mantine/core";
import { formatDistanceToNow } from "date-fns";
import type { IconType } from "react-icons";
import { FaCalendar, FaDownload, FaStar } from "react-icons/fa6";
import type { ModDataVisibility, ModReleaseData } from "../../_autogen/api.ts";
import { Stat } from "../../components/Stat.tsx";
import { useAppTranslation } from "../../i18n/useAppTranslation.ts";
import { VisibilityIcons } from "../../icons.ts";

export type _ReleaseProps = {
	release: ModReleaseData;
};

export function _Release(props: _ReleaseProps) {
	const { t } = useAppTranslation();
	const Ico: IconType = VisibilityIcons[props.release.visibility];

	return (
		<Alert
			icon={<Ico />}
			variant={"default"}
			title={
				<Group>
					<Text size={"sm"} fw={"bold"}>
						{props.release.version}
					</Text>
					<Badge variant={"light"} color={colors[props.release.visibility]} style={{ textTransform: "none" }}>
						{props.release.visibility}
					</Badge>
					{props.release.isLatest && (
						<Badge variant={"filled"} color="blue" leftSection={<FaStar size={12} />} style={{ textTransform: "none" }}>
							Latest
						</Badge>
					)}
				</Group>
			}
		>
			<Group>
				{props.release.createdAt && (
					<Stat
						icon={FaCalendar}
						stat={t("CREATED_AT_DISTANCE", { distance: formatDistanceToNow(props.release.createdAt) })}
					/>
				)}
				<Stat icon={FaDownload} stat={`${props.release.downloadsCount} Downloads`} />
			</Group>
		</Alert>
	);
}

const colors: Record<ModDataVisibility, MantineColor> = {
	PRIVATE: "orange",
	PUBLIC: "green",
	UNLISTED: "yellow",
};
