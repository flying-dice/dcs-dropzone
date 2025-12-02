import { Card, Group, Rating, Stack, Text } from "@mantine/core";

export function _UserModRating(props: { subscriptions: number; rating: number }) {
	return (
		<Card withBorder>
			<Stack>
				<Text size={"lg"} fw={"bold"}>
					Quick Stats
				</Text>
				<Group justify={"space-between"}>
					<Text c={"gray"}>Subscriptions</Text>
					<Text fw={"bold"}>{props.subscriptions}</Text>
				</Group>
				<Group justify={"space-between"}>
					<Text c={"gray"}>Average Rating</Text>
					<Group gap={"xs"}>
						<Text fw={"bold"}>{props.rating}</Text>
						<Rating readOnly value={props.rating} />
					</Group>
				</Group>
			</Stack>
		</Card>
	);
}
