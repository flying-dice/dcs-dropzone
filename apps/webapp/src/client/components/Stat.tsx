import { Group, type MantineColor, Text, ThemeIcon } from "@mantine/core";
import type { IconType } from "react-icons";

export type StatProps = {
	icon: IconType;
	stat: string | number;
	iconColor?: MantineColor;
	statColor?: MantineColor;
};
export function Stat(props: StatProps) {
	return (
		<Group gap={0} align="center">
			<ThemeIcon variant={"subtle"} c={props.iconColor || "dimmed"}>
				<props.icon size={"0.75em"} />
			</ThemeIcon>
			<Text size={"sm"} c={props.statColor || "dimmed"} fz={14}>
				{props.stat}
			</Text>
		</Group>
	);
}
