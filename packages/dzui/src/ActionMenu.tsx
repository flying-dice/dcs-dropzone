import { ActionIcon, Button, Group, Tooltip } from "@mantine/core";
import type { IconType } from "react-icons";
import { match } from "ts-pattern";

export type ActionMenuItemProps = {
	id: string;
	label: string;
	onClick: () => void;
	active?: boolean;
	disabled?: boolean;
	icon: IconType;
};

function ActionMenuIconItem(props: ActionMenuItemProps) {
	return (
		<Tooltip label={props.label} withArrow>
			<ActionIcon
				variant={props.active ? "light" : "transparent"}
				disabled={props.disabled}
				onClick={props.onClick}
				size={"lg"}
			>
				{<props.icon />}
			</ActionIcon>
		</Tooltip>
	);
}

function ActionMenuButtonItem(props: ActionMenuItemProps) {
	return (
		<Button
			leftSection={<props.icon />}
			variant={props.active ? "light" : "transparent"}
			disabled={props.disabled}
			onClick={props.onClick}
			styles={props.active ? { label: { textDecoration: "underline" } } : undefined}
		>
			{props.label}
		</Button>
	);
}

function ActionMenuFooterItem(props: ActionMenuItemProps) {
	return (
		<Button
			h={"100%"}
			radius={0}
			leftSection={<props.icon />}
			variant={props.active ? "light" : "transparent"}
			disabled={props.disabled}
			onClick={props.onClick}
			styles={props.active ? { label: { textDecoration: "underline" } } : undefined}
		>
			{props.label}
		</Button>
	);
}

export type ActionMenuProps = {
	variant: "icon" | "button" | "footer";
	actions: {
		id: string;
		label: string;
		onClick: () => void;
		active?: boolean;
		disabled?: boolean;
		icon: IconType;
	}[];
};
export function ActionMenu(props: ActionMenuProps) {
	return (
		<Group gap={"xs"} flex={"auto"} grow>
			{props.actions.map((action) =>
				match(props.variant)
					.when(
						(it) => it === "icon",
						() => <ActionMenuIconItem {...action} key={action.id} />,
					)
					.when(
						(it) => it === "button",
						() => <ActionMenuButtonItem {...action} key={action.id} />,
					)
					.when(
						(it) => it === "footer",
						() => <ActionMenuFooterItem {...action} key={action.id} />,
					)
					.otherwise(() => null),
			)}
		</Group>
	);
}
