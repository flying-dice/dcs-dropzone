import { ActionIcon, Menu } from "@mantine/core";
import type { IconType } from "react-icons";
import { BsBug } from "react-icons/bs";

export type DebugMenuProps = {
	items: {
		id: string;
		label: string;
		icon: IconType;
		onClick: (event: React.MouseEvent) => void;
	}[];
};
export function DebugMenu(props: DebugMenuProps) {
	return (
		<Menu>
			<Menu.Target>
				<ActionIcon variant={"default"} size={"lg"}>
					<BsBug />
				</ActionIcon>
			</Menu.Target>
			<Menu.Dropdown>
				{props.items.map((item) => (
					<Menu.Item key={item.id} onClick={item.onClick} leftSection={<item.icon />}>
						{item.label}
					</Menu.Item>
				))}
			</Menu.Dropdown>
		</Menu>
	);
}
