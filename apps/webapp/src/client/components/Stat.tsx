import { Group, type MantineColor, Text, ThemeIcon } from "@mantine/core";
import type { ReactNode } from "react";
import type { IconType } from "react-icons";
import { match } from "ts-pattern";

export type StatProps = {
	icon: IconType;
	stat: string | number | ReactNode;
	iconColor?: MantineColor;
	statColor?: MantineColor;
};
export function Stat(props: StatProps) {
	return (
		<Group gap={0} align="center">
			<ThemeIcon variant={"subtle"} c={props.iconColor || "dimmed"}>
				<props.icon size={"0.75em"} />
			</ThemeIcon>
			{match(props.stat)
				.when(
					(stat) => typeof stat === "number" || typeof stat === "string",
					(stat) => (
						<Text size={"sm"} c={props.statColor || "dimmed"} fz={14}>
							{stat}
						</Text>
					),
				)
				.otherwise((stat) => stat)}
		</Group>
	);
}
