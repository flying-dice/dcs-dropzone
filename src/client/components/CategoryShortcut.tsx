import { NavLink, Text } from "@mantine/core";

export type CategoryShortcutProps = {
	label: string;
	count: number;
};
export function CategoryShortcut({ label, count }: CategoryShortcutProps) {
	return (
		<NavLink
			styles={{ root: { borderRadius: "0.5rem" } }}
			rightSection={
				<Text c={"dimmed"} fz={14}>
					{count}
				</Text>
			}
			label={
				<Text fz={14} fw={"normal"}>
					{label}
				</Text>
			}
		/>
	);
}
