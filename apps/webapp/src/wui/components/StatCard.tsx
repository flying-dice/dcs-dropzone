import { Card, Group, type MantineColor, Stack, Text, ThemeIcon } from "@mantine/core";
import type { IconType } from "react-icons";

export type StatCardProps = {
	icon: IconType;
	label: string;
	value: string | number;
	iconColor?: MantineColor;
};
export function StatCard(props: StatCardProps) {
	return (
		<Card withBorder radius={"md"} flex={"auto"}>
			<Group>
				<ThemeIcon size="xl" variant={"light"} color={props.iconColor}>
					<props.icon />
				</ThemeIcon>
				<Stack gap={0}>
					<Text size={"sm"} c={"dimmed"}>
						{props.label}
					</Text>
					<Text size={"xl"} fw={"bold"}>
						{props.value}
					</Text>
				</Stack>
			</Group>
		</Card>
	);
}
