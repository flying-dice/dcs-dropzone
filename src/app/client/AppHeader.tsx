import {
	ActionIcon,
	AppShell,
	Burger,
	Group,
	Image,
	Indicator,
	Menu,
	Popover,
	Stack,
	useMantineColorScheme,
} from "@mantine/core";
import type { UseDisclosureReturnValue } from "@mantine/hooks";
import { BsLaptop, BsMoon, BsSun } from "react-icons/bs";
import { FaDownload } from "react-icons/fa6";
import { useWindowSize } from "react-use";
import icon from "./assets/icon.svg";
import logo from "./assets/logo.svg";
import { AssetListItem } from "./components/AssetListItem.tsx";
import { ProfileMenu } from "./components/ProfileMenu.tsx";
import { useDaemonSubscriptions } from "./hooks/useDaemonSubscriber.ts";
import { useAppTranslation } from "./i18n/useAppTranslation.ts";

export type AppHeaderProps = {
	navbar: UseDisclosureReturnValue;
};

export function AppHeader(props: AppHeaderProps) {
	const { colorScheme, setColorScheme } = useMantineColorScheme();
	const { t } = useAppTranslation();
	const { width } = useWindowSize();
	const daemon = useDaemonSubscriptions();

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
							<Popover>
								<Popover.Target>
									<Indicator withBorder processing disabled={!daemon.isActive}>
										<ActionIcon size={"lg"} disabled={!daemon.isActive}>
											<FaDownload />
										</ActionIcon>
									</Indicator>
								</Popover.Target>
								<Popover.Dropdown>
									{daemon.active?.map((mod) =>
										mod.assets.map((asset) => (
											<AssetListItem
												key={asset.name}
												name={asset.name}
												urls={asset.urls}
												isArchive={asset.isArchive}
												progressPercent={
													asset.statusData?.overallPercentProgress
												}
												status={asset.statusData?.status}
											/>
										)),
									)}
								</Popover.Dropdown>
							</Popover>
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
