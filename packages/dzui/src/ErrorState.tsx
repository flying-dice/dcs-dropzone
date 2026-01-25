import { Paper, Stack, Text, ThemeIcon, useComputedColorScheme } from "@mantine/core";
import type { IconType } from "react-icons";

export type ErrorStateProps = {
	title: string;
	description: string;
	icon: IconType;
	withoutBorder?: boolean;
};
export function ErrorState(props: ErrorStateProps) {
	const scheme = useComputedColorScheme();

	return (
		<Paper
			p={"xl"}
			withBorder={!props.withoutBorder}
			bg={scheme === "light" ? "gray.0" : "dark.8"}
			c={scheme === "light" ? "gray.5" : "gray.6"}
			style={props.withoutBorder ? undefined : { border: "dashed", borderWidth: "1px" }}
		>
			<Stack justify={"center"} align={"center"}>
				<ThemeIcon size={48} radius={"xl"} variant={"light"} color={"red"}>
					<props.icon />
				</ThemeIcon>
				<Text c={scheme === "light" ? "dark.6" : "gray.4"} fw={"bold"} size={"md"} style={{ textAlign: "center" }}>
					{props.title}
				</Text>

				<Text c={"dimmed"} size={"sm"} style={{ textAlign: "center" }}>
					{props.description}
				</Text>
			</Stack>
		</Paper>
	);
}
