import { Divider, Group, Text } from "@mantine/core";

export type PathWithRootProps = {
	root: string;
	path: string;
};
export function PathWithRoot(props: PathWithRootProps) {
	return (
		<Group gap={"xs"}>
			<Text size={"sm"} c={"dimmed"}>
				{props.root}
			</Text>
			<Divider orientation={"vertical"} />
			<Text size={"sm"}>{props.path}</Text>
		</Group>
	);
}
