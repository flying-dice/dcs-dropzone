import { TextAttributes } from "@opentui/core";

export type KeyValueItemProps = {
	label: string;
	value: string;
};
export function KeyValueItem(props: KeyValueItemProps) {
	return (
		<box flexDirection={"row"} gap={1}>
			<text attributes={TextAttributes.BOLD}>{props.label}:</text>
			<text>{props.value}</text>
		</box>
	);
}
