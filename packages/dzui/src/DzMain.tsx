import { AppShell, useComputedColorScheme } from "@mantine/core";
import type { ReactNode } from "react";

export type DzMainProps = {
	children?: ReactNode;
};
export function DzMain(props: DzMainProps) {
	const colorScheme = useComputedColorScheme();

	return <AppShell.Main bg={colorScheme === "light" ? "gray.0" : "dark.8"}>{props.children}</AppShell.Main>;
}
