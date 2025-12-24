import { TextAttributes } from "@opentui/core";
import type { ReactNode } from "react";
import { Colors } from "./theme.ts";

export type NavbarItemProps = {
	label: string;
	active?: boolean;
	height?: number;
	dimmed?: boolean;
	icon?: ReactNode;
};
export function NavbarItem(props: NavbarItemProps) {
	return (
		<box
			height={props.height}
			flexDirection={"row"}
			gap={1}
			backgroundColor={props.active ? Colors.PRIMARY : undefined}
		>
			{props.icon}
			<text attributes={props.active ? TextAttributes.UNDERLINE : props.dimmed ? TextAttributes.DIM : undefined}>
				{props.label}
			</text>
		</box>
	);
}
