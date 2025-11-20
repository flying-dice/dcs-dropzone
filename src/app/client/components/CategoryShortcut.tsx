import { NavLink, Text } from "@mantine/core";

export type CategoryShortcutProps = {
	label: string;
	count: number;
	onClick?: () => void;
};
export function CategoryShortcut(props: CategoryShortcutProps) {
	return (
		<NavLink
			styles={{ root: { borderRadius: "0.5rem" } }}
			rightSection={
				<Text c={"dimmed"} fz={14}>
					{props.count}
				</Text>
			}
			label={
				<Text fz={14} fw={"normal"}>
					{props.label}
				</Text>
			}
			onClick={props.onClick}
		/>
	);
}
