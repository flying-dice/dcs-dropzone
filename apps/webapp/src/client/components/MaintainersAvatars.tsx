import { Avatar, type MantineSize, Tooltip } from "@mantine/core";
import type { UserData } from "../_autogen/api.ts";

export type MaintainersAvatarsProps = {
	maintainers: UserData[];
	limit?: number;
	size?: MantineSize;
};
export function MaintainersAvatars(props: MaintainersAvatarsProps) {
	const limitedMaintainers = props.limit ? props.maintainers.slice(0, props.limit) : props.maintainers;
	const extraCount = props.limit && props.maintainers.length > props.limit ? props.maintainers.length - props.limit : 0;

	return (
		<Avatar.Group>
			{limitedMaintainers.map((it) => (
				<Tooltip key={it.id} label={it.name || it.username}>
					<Avatar
						size={props.size}
						name={it.name || it.username}
						src={it.avatarUrl}
						color={"initials"}
						style={{
							cursor: "pointer",
						}}
						onClick={() => window.open(it.profileUrl, "_blank")}
					/>
				</Tooltip>
			))}
			{extraCount > 0 && <Avatar color="gray">+{extraCount}</Avatar>}
		</Avatar.Group>
	);
}
