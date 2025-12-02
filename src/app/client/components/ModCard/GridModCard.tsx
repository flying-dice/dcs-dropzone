import { Badge, Card, Center, Flex, Group, Stack, Text } from "@mantine/core";
import { FaDownload, FaStar } from "react-icons/fa";
import { ModImage } from "../ModImage.tsx";
import { Stat } from "../Stat.tsx";
import type { ModCardProps } from "./types.ts";

/**
 * Grid variant of ModCard - optimized for grid layouts
 */
export function GridModCard(props: ModCardProps) {
	return (
		<Card
			flex={"auto"}
			radius={"md"}
			withBorder
			onClick={props.onClick}
			style={props.onClick ? { cursor: "pointer" } : {}}
		>
			<Flex flex={"auto"} direction={"column"} gap={"sm"}>
				<Card.Section>
					<Center>
						<ModImage src={props.imageUrl} />
					</Center>
				</Card.Section>
				<Stack flex={"auto"} gap={"xs"} justify={"space-between"}>
					<Stack gap={"xs"} flex={"auto"}>
						<Text fw={"bold"} lineClamp={1}>
							{props.title}
						</Text>
						<Text fz={"sm"} lineClamp={2}>
							{props.summary}
						</Text>
					</Stack>
					<Group justify="space-between">
						<Badge variant={"light"}>{props.category}</Badge>
						<Group gap={"xs"}>
							<Stat icon={FaDownload} stat={props.downloads} />
							<Stat
								iconColor={"dcsyellow"}
								icon={FaStar}
								stat={props.averageRating.toFixed(1)}
							/>
						</Group>
					</Group>
				</Stack>
			</Flex>
		</Card>
	);
}
