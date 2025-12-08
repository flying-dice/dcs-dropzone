import { ActionIcon, Badge, Button, Group, SimpleGrid, Stack, Text } from "@mantine/core";
import { formatDistanceToNow } from "date-fns";
import { FaShare } from "react-icons/fa6";
import type { ModData, ModReleaseData } from "../../_autogen/api.ts";
import { Stat } from "../../components/Stat.tsx";
import { useAppTranslation } from "../../i18n/useAppTranslation.ts";
import { AppIcons } from "../../icons.ts";

export type _BasicInfoProps = {
	mod: ModData;
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
					icon={AppIcons.Releases}
					stat={
						props.latestRelease?.createdAt
							? t("MOD_CREATED_AT_DISTANCE", {
									distance: formatDistanceToNow(props.latestRelease.createdAt),
								})
							: "-"
					}
				/>
				<Stat iconColor={"blue"} icon={AppIcons.Featured} stat={props.mod.maintainers.join(",") || "-"} />
				<Stat iconColor={"blue"} icon={AppIcons.Releases} stat={props.latestRelease?.version || "-"} />
			</SimpleGrid>
			<Group>
				<Button flex={"auto"} leftSection={<AppIcons.Downloaded />}>
					{t("DOWNLOAD")}
				</Button>
				<ActionIcon size={"lg"} variant={"default"}>
					<FaShare />
				</ActionIcon>
			</Group>
		</Stack>
	);
}
