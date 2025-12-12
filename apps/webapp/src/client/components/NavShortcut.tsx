import { Badge, type MantineColor, NavLink, Text } from "@mantine/core";
import { isNumber } from "lodash";
import type { IconType } from "react-icons";
import { useLocation, useNavigate } from "react-router-dom";

export type CategoryShortcutProps = {
	icon: IconType;
	label: string;
	count?: number;
	countColor?: MantineColor;
	to?: string;
};
export function NavShortcut(props: CategoryShortcutProps) {
	const nav = useNavigate();
	const location = useLocation();

	const active = props.to ? location.pathname === props.to : false;

	return (
		<NavLink
			active={active}
			styles={{ root: { borderRadius: "0.5rem" } }}
			leftSection={<props.icon />}
			rightSection={
				props.count !== undefined && props.count !== null && isNumber(props.count) ? (
					<Badge color={props.countColor}>{props.count}</Badge>
				) : undefined
			}
			label={
				<Text fz={14} fw={"normal"}>
					{props.label}
				</Text>
			}
			onClick={
				props.to
					? () => {
							if (!props.to) return;
							nav(props.to);
						}
					: undefined
			}
		/>
	);
}
