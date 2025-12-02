import { Badge, Card, Flex, Group, Stack, Text } from "@mantine/core";
import { FaDownload, FaStar } from "react-icons/fa";
import { ModImage } from "../ModImage.tsx";
import { Stat } from "../Stat.tsx";
import type { ModCardProps } from "./types.ts";

/**
 * List variant of ModCard - optimized for list layouts
 */
export function ListModCard(props: ModCardProps) {
	return (
		<Card
			flex={"auto"}
			radius={"md"}
			withBorder
			onClick={props.onClick}
			style={props.onClick ? { cursor: "pointer" } : {}}
		>
			<Flex wrap={"nowrap"} gap={"md"}>
				<ModImage radius={"sm"} src={props.imageUrl} props={{ aspectRatio: { maw: 150, miw: 150 } }} />

				<Flex wrap={"nowrap"} flex={"auto"} gap={"md"}>
					<Stack flex={"auto"} justify={"space-between"} gap={0}>
						<Stack flex={"auto"} gap={0}>
							<Text fw={"bold"} lineClamp={1}>
								{props.title}
							</Text>
							<Text fz={"sm"} lineClamp={2}>
								{props.summary}
							</Text>
						</Stack>
						<Group wrap={"nowrap"}>
							<Badge variant={"light"}>{props.category}</Badge>
							<Group wrap={"nowrap"} gap={"xs"}>
								<Stat icon={FaDownload} stat={props.downloads} />
								<Stat iconColor={"dcsyellow"} icon={FaStar} stat={props.averageRating.toFixed(1)} />
							</Group>
						</Group>
					</Stack>
				</Flex>
			</Flex>
		</Card>
	);
}
