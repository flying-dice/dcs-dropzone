import { ActionIcon, Menu, useMantineColorScheme } from "@mantine/core";
import { BsLaptop, BsMoon, BsSun } from "react-icons/bs";

export type ColorSchemeControlsProps = {
	lightLabel: string;
	darkLabel: string;
	autoLabel: string;
};
export function ColorSchemeControls(props: ColorSchemeControlsProps) {
	const { colorScheme, setColorScheme } = useMantineColorScheme();

	return (
		<Menu>
			<Menu.Target>
				<ActionIcon variant={"default"} size={"lg"}>
					{colorScheme === "dark" ? <BsMoon /> : colorScheme === "light" ? <BsSun /> : <BsLaptop />}
				</ActionIcon>
			</Menu.Target>
			<Menu.Dropdown>
				<Menu.Item
					onClick={() => setColorScheme("light")}
					color={colorScheme === "light" ? "primary" : undefined}
					leftSection={<BsSun />}
				>
					{props.lightLabel}
				</Menu.Item>
				<Menu.Item
					onClick={() => setColorScheme("dark")}
					color={colorScheme === "dark" ? "primary" : undefined}
					leftSection={<BsMoon />}
				>
					{props.darkLabel}
				</Menu.Item>
				<Menu.Item
					onClick={() => setColorScheme("auto")}
					color={colorScheme === "auto" ? "primary" : undefined}
					leftSection={<BsLaptop />}
				>
					{props.autoLabel}
				</Menu.Item>
			</Menu.Dropdown>
		</Menu>
	);
}
