import {
	Badge,
	Button,
	Card,
	Flex,
	Group,
	Image,
	Stack,
	Text,
} from "@mantine/core";
import { FaDownload, FaPlus, FaStar } from "react-icons/fa";
import { ModImage } from "./ModImage.tsx";
import { Stat } from "./Stat.tsx";

function GridModCard(props: ModCardProps) {
	return (
		<Card radius={"md"} withBorder>
			<Stack gap={"xs"}>
				<Card.Section>
					<ModImage w={300} src={props.imageUrl} />
				</Card.Section>
				<Text fw={"bold"}>{props.title}</Text>
				<Text fz={"sm"} lineClamp={3}>
					{props.summary}
				</Text>
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
				<Button leftSection={<FaPlus />}>
					{props.isSubscribed ? "Unsubscribe" : "Subscribe"}
				</Button>
			</Stack>
		</Card>
	);
}

function ListModCard(props: ModCardProps) {
	return (
		<Card radius={"md"} withBorder p={0}>
			<Flex wrap={"nowrap"}>
				<ModImage w={300} src={props.imageUrl} />
				<Flex wrap={"nowrap"} flex={"auto"} p={"md"} gap={"md"}>
					<Stack flex={"auto"} justify={"space-between"}>
						<Stack flex={"auto"} gap={0}>
							<Text fw={"bold"}>{props.title}</Text>
							<Text fz={"sm"} lineClamp={3}>
								{props.summary}
							</Text>
						</Stack>
						<Group>
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
					<Group>
						<Button leftSection={<FaPlus />}>
							{props.isSubscribed ? "Unsubscribe" : "Subscribe"}
						</Button>
					</Group>
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
	isSubscribed: boolean;
	onSubscribeToggle: () => void;
	variant: "list" | "grid";
};
export function ModCard(props: ModCardProps) {
	if (props.variant === "grid") {
		return <GridModCard {...props} />;
	} else {
		return <ListModCard {...props} />;
	}
}
