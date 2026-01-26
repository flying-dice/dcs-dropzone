import { Badge, Group, SimpleGrid, Stack, Text } from "@mantine/core";
import { AppIcons, useAppTranslation } from "@packages/dzui";
import { formatDistanceToNow } from "date-fns";
import { FaCalendar } from "react-icons/fa6";
import type { ModData, ModReleaseData, UserData } from "../../_autogen/api.ts";
import { MaintainersAvatars } from "../../components/MaintainersAvatars.tsx";
import { Stat } from "../../components/Stat.tsx";

export type _BasicInfoProps = {
	mod: ModData;
	maintainers: UserData[];
	latestRelease?: ModReleaseData;
};

export function _BasicInfo(props: _BasicInfoProps) {
	const { t } = useAppTranslation();

	return (
		<Stack>
			<Group gap={"xs"}>
				<Badge>{props.mod.category}</Badge>
				{props.mod.tags.map((tag) => (
					<Badge variant={"light"} key={tag} color="green">
						{tag}
					</Badge>
				))}
			</Group>
			<Text fz={"lg"} fw={"bold"}>
				{props.mod.name}
			</Text>
			<Text>{props.mod.description}</Text>
			<SimpleGrid cols={2}>
				<Stat iconColor={"blue"} icon={AppIcons.Downloaded} stat={props.mod.downloadsCount} />
				<Stat
					iconColor={"blue"}
					icon={FaCalendar}
					stat={
						props.latestRelease?.createdAt
							? t("UPDATED_AT_DISTANCE", {
									distance: formatDistanceToNow(props.latestRelease.createdAt),
								})
							: "-"
					}
				/>
				<Stat
					iconColor={"blue"}
					icon={AppIcons.Author}
					stat={
						props.maintainers.length ? (
							<MaintainersAvatars maintainers={props.maintainers} size={"sm"} limit={5} />
						) : (
							"-"
						)
					}
				/>
				<Stat iconColor={"blue"} icon={AppIcons.Releases} stat={props.latestRelease?.version || "-"} />
			</SimpleGrid>
		</Stack>
	);
}
