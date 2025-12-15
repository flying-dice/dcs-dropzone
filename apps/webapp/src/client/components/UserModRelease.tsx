import { Alert, Badge, Group, type MantineColor, Text } from "@mantine/core";
import { formatDistanceToNow } from "date-fns";
import type { IconType } from "react-icons";
import { FaCalendar, FaDownload, FaStar } from "react-icons/fa6";
import type { ModDataVisibility, ModReleaseData } from "../_autogen/api.ts";
import { VisibilityIcons } from "../icons.ts";
import { Stat } from "./Stat.tsx";

export type UserModReleaseProps = {
	release: ModReleaseData;
	onClick: () => void;
};

export function UserModRelease(props: UserModReleaseProps) {
	const Ico: IconType = VisibilityIcons[props.release.visibility];

	return (
		<Alert
			onClick={props.onClick}
			style={{ cursor: "pointer" }}
			icon={<Ico />}
			variant={"light"}
			color={colors[props.release.visibility]}
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
				<Stat
					icon={FaCalendar}
					stat={`Created ${formatDistanceToNow(new Date(Date.now() - 100000000), {
						addSuffix: true,
					})}`}
				/>
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
