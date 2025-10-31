import {
	ActionIcon,
	AppShell,
	Group,
	Image,
	Menu,
	Stack,
	TextInput,
	useMantineColorScheme,
} from "@mantine/core";
import { BsLaptop, BsMoon, BsSun } from "react-icons/bs";
import logo from "./assets/logo.svg";
import { ProfileMenu } from "./components/ProfileMenu.tsx";

export function AppHeader() {
	const { colorScheme, setColorScheme } = useMantineColorScheme();

	return (
		<AppShell.Header>
			<Stack pl="md" h="100%" justify="center">
				<Group justify="space-between">
					<Image w={"min-content"} h={44} src={logo} />
					<Stack gap={2} pr="md">
						<Group>
							<TextInput placeholder="Search mods..." w={320} />
							<Menu>
								<Menu.Target>
									<ActionIcon variant={"default"} size={"lg"}>
										{colorScheme === "dark" ? (
											<BsMoon />
										) : colorScheme === "light" ? (
											<BsSun />
										) : (
											<BsLaptop />
										)}
									</ActionIcon>
								</Menu.Target>
								<Menu.Dropdown>
									<Menu.Item
										onClick={() => setColorScheme("light")}
										color={colorScheme === "light" ? "primary" : undefined}
										leftSection={<BsSun />}
									>
										Light
									</Menu.Item>
									<Menu.Item
										onClick={() => setColorScheme("dark")}
										color={colorScheme === "dark" ? "primary" : undefined}
										leftSection={<BsMoon />}
									>
										Dark
									</Menu.Item>
									<Menu.Item
										onClick={() => setColorScheme("auto")}
										color={colorScheme === "auto" ? "primary" : undefined}
										leftSection={<BsLaptop />}
									>
										Auto
									</Menu.Item>
								</Menu.Dropdown>
							</Menu>
							<ProfileMenu />
						</Group>
					</Stack>
				</Group>
			</Stack>
		</AppShell.Header>
	);
}
