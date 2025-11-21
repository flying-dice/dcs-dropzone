import {
	Badge,
	Card,
	Center,
	Flex,
	Group,
	type MantineColor,
	Stack,
	Text,
} from "@mantine/core";
import type { IconType } from "react-icons";
import { FaDownload, FaStar } from "react-icons/fa";
import { ModImage } from "./ModImage.tsx";
import { Stat } from "./Stat.tsx";

function GridModCard(props: ModCardProps) {
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
							<Stat icon={FaDownload} stat={props.subscribers} />
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

function ListModCard(props: ModCardProps) {
	return (
		<Card
			flex={"auto"}
			radius={"md"}
			withBorder
			onClick={props.onClick}
			style={props.onClick ? { cursor: "pointer" } : {}}
		>
			<Flex wrap={"nowrap"} gap={"md"}>
				<ModImage
					radius={"sm"}
					src={props.imageUrl}
					props={{ aspectRatio: { maw: 150, miw: 150 } }}
				/>

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
								<Stat icon={FaDownload} stat={props.subscribers} />
								<Stat
									iconColor={"dcsyellow"}
									icon={FaStar}
									stat={props.averageRating.toFixed(1)}
								/>
							</Group>
						</Group>
					</Stack>
				</Flex>
			</Flex>
		</Card>
	);
}

export type ModCardProps = {
	imageUrl: string;
	category: string;
	averageRating: number;
	title: string;
	summary: string;
	subscribers: number;
	isSubscribed?: boolean;
	actions?: {
		label: string;
		onClick: () => void;
		icon: IconType;
		color: MantineColor;
	}[];
	variant: "list" | "grid";
	onClick?: () => void;
};
export function ModCard(props: ModCardProps) {
	if (props.variant === "grid") {
		return <GridModCard {...props} />;
	} else {
		return <ListModCard {...props} />;
	}
}
