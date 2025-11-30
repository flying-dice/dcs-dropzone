import { ActionIcon, Menu, useMantineColorScheme } from "@mantine/core";
import { BsLaptop, BsMoon, BsSun } from "react-icons/bs";
import { useAppTranslation } from "../i18n/useAppTranslation.ts";

export function ColorSchemeControls() {
	const { colorScheme, setColorScheme } = useMantineColorScheme();
	const { t } = useAppTranslation();

	return (
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
	);
}
