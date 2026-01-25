import { AppShell, Burger, Group, Image, Stack } from "@mantine/core";
import type { UseDisclosureReturnValue } from "@mantine/hooks";
import type * as React from "react";
import { useWindowSize } from "react-use";
import icon from "./assets/icon.svg";
import logo from "./assets/logo.svg";

export type DzHeaderProps = {
	navbar?: UseDisclosureReturnValue;
	children?: React.ReactNode;
};

export function DzHeader(props: DzHeaderProps) {
	const { width } = useWindowSize();

	return (
		<AppShell.Header>
			<Stack pl="md" h="100%" justify="center">
				<Group justify="space-between">
					<Group gap={"xs"}>
						{props.navbar && <Burger opened={props.navbar[0]} onClick={props.navbar[1].toggle} hiddenFrom="md" />}
						<Image w={"min-content"} h={44} src={width < 900 ? icon : logo} />
					</Group>
					<Stack gap={2} pr="md">
						<Group>{props.children}</Group>
					</Stack>
				</Group>
			</Stack>
		</AppShell.Header>
	);
}
