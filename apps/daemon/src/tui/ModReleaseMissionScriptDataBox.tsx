import { TextAttributes } from "@opentui/core";
import type { ModReleaseMissionScriptData } from "../application/schemas/ModAndReleaseData.ts";
import { Stack } from "./components.tsx";
import { KeyValueItem } from "./KeyValueItem.tsx";

export type ModReleaseMissionScriptDataBoxProps = { script: ModReleaseMissionScriptData };

export function ModReleaseMissionScriptDataBox(props: ModReleaseMissionScriptDataBoxProps) {
	return (
		<Stack gap={0}>
			<text attributes={TextAttributes.UNDERLINE}>{props.script.name}</text>
			<box paddingLeft={1}>
				<KeyValueItem label={"Purpose"} value={props.script.purpose} />
				<KeyValueItem label={"Path"} value={`${props.script.root} | ${props.script.path}`} />
				<KeyValueItem label={"Run On"} value={props.script.runOn} />
			</box>
		</Stack>
	);
}
