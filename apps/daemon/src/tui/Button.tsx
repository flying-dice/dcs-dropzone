import type { ReactNode } from "react";
import { Colors } from "./theme.ts";

export type ButtonProps = {
	active?: boolean;
	children: ReactNode;
	flexGrow?: number;
	height?: number;
};
export function Button({ height, active, children, flexGrow }: ButtonProps) {
	return (
		<box height={height} border borderColor={active ? Colors.PRIMARY : "gray"} flexGrow={flexGrow}>
			{children}
		</box>
	);
}
