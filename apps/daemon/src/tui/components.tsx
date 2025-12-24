import type { ReactNode } from "react";

export type StackProps = {
	flexDirection?: "row" | "column";
	gap?: number;
	children: ReactNode;
};
export function Stack(props: StackProps) {
	return (
		<box flexDirection={props.flexDirection || "column"} gap={props.gap ?? 1}>
			{props.children}
		</box>
	);
}

export type GroupProps = {
	flexDirection?: "row" | "column";
	children: ReactNode;
	gap?: number;
};

export function Group(props: GroupProps) {
	return (
		<box flexDirection={props.flexDirection || "row"} gap={props.gap ?? 1}>
			{props.children}
		</box>
	);
}
