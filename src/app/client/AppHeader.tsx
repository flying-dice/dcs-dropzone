import { AppShell, Burger, Group, Image, Stack } from "@mantine/core";
import type { UseDisclosureReturnValue } from "@mantine/hooks";
import { useWindowSize } from "react-use";
import icon from "./assets/icon.svg";
import logo from "./assets/logo.svg";
import { AssetActivity } from "./components/AssetActivity.tsx";
import { ColorSchemeControls } from "./components/ColorSchemeControls.tsx";
import { ProfileMenu } from "./components/ProfileMenu.tsx";

export type AppHeaderProps = {
	navbar: UseDisclosureReturnValue;
};

export function AppHeader(props: AppHeaderProps) {
	const { width } = useWindowSize();

	return (
		<AppShell.Header>
			<Stack pl="md" h="100%" justify="center">
				<Group justify="space-between">
					<Group gap={"xs"}>
						<Burger
							opened={props.navbar[0]}
							onClick={props.navbar[1].toggle}
							hiddenFrom="md"
						/>

						<Image w={"min-content"} h={44} src={width < 900 ? icon : logo} />
					</Group>
					<Stack gap={2} pr="md">
						<Group>
							<AssetActivity />
							<ColorSchemeControls />
							<ProfileMenu />
						</Group>
					</Stack>
				</Group>
			</Stack>
		</AppShell.Header>
	);
}
