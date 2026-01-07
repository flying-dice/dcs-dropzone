import { Avatar, Group, Stack, Text } from "@mantine/core";
import type { UserData } from "../../_autogen/api.ts";

export type _MaintainersProps = {
	maintainers: UserData[];
};

export function _Maintainers(props: _MaintainersProps) {
	return (
		<Stack>
			{props.maintainers.map((maintainer) => (
				<Group key={maintainer.id} gap={"sm"} wrap={"nowrap"}>
					<Avatar
						src={maintainer.avatarUrl}
						radius={"xl"}
						color={"initials"}
						name={maintainer.name || maintainer.username}
					/>
					<Text style={{ whiteSpace: "nowrap" }}>{maintainer.name || maintainer.username}</Text>
				</Group>
			))}
		</Stack>
	);
}
