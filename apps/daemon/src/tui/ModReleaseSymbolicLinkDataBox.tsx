import { TextAttributes } from "@opentui/core";
import type { ModReleaseSymbolicLinkData } from "../schemas/ModAndReleaseData.ts";
import { Stack } from "./components.tsx";
import { KeyValueItem } from "./KeyValueItem.tsx";

export type ModReleaseSymbolicLinkDataBoxProps = { link: ModReleaseSymbolicLinkData };
export function ModReleaseSymbolicLinkDataBox(props: ModReleaseSymbolicLinkDataBoxProps) {
	return (
		<Stack gap={0}>
			<text attributes={TextAttributes.UNDERLINE}>{props.link.name}</text>
			<box paddingLeft={1}>
				<KeyValueItem label={"Source"} value={props.link.src} />
				<KeyValueItem label={"Destination"} value={`${props.link.destRoot} | ${props.link.dest}`} />
			</box>
		</Stack>
	);
}
