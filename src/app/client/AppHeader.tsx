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
import { useAppTranslation } from "./i18n/useAppTranslation.ts";

export function AppHeader() {
	const { colorScheme, setColorScheme } = useMantineColorScheme();
	const { t } = useAppTranslation();

	return (
		<AppShell.Header>
			<Stack pl="md" h="100%" justify="center">
				<Group justify="space-between">
					<Image w={"min-content"} h={44} src={logo} />
					<Stack gap={2} pr="md">
						<Group>
							<TextInput placeholder={t("SEARCH_MODS_PLACEHOLDER")} w={320} />
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
										{t("LIGHT")}
									</Menu.Item>
									<Menu.Item
										onClick={() => setColorScheme("dark")}
										color={colorScheme === "dark" ? "primary" : undefined}
										leftSection={<BsMoon />}
									>
										{t("DARK")}
									</Menu.Item>
									<Menu.Item
										onClick={() => setColorScheme("auto")}
										color={colorScheme === "auto" ? "primary" : undefined}
										leftSection={<BsLaptop />}
									>
										{t("AUTO")}
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
