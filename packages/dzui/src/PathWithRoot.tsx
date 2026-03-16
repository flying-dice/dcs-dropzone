import { Divider, Group, type MantineSize, Text } from "@mantine/core";

export type PathWithRootProps = {
	root: string;
	path: string;
	size?: MantineSize;
};
export function PathWithRoot(props: PathWithRootProps) {
	const size = props.size || "sm";
	return (
		<Group gap={"xs"}>
			<Text size={size} c={"dimmed"}>
				{props.root}
			</Text>
			<Divider orientation={"vertical"} />
			<Text size={size}>{props.path}</Text>
		</Group>
	);
}
