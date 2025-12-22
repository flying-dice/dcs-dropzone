import type { ModReleaseMissionScriptData } from "../schemas/ModAndReleaseData.ts";
import { KeyValueItem } from "./KeyValueItem.tsx";

export type ModReleaseMissionScriptDataBoxProps = { script: ModReleaseMissionScriptData };

export function ModReleaseMissionScriptDataBox(props: ModReleaseMissionScriptDataBoxProps) {
	return (
		<box marginLeft={1} title={props.script.name} flexDirection={"column"} borderStyle={"rounded"} borderColor={"gray"}>
			<KeyValueItem label={"Purpose"} value={props.script.purpose} />
			<KeyValueItem label={"Path"} value={props.script.path} />
			<KeyValueItem label={"Root"} value={props.script.root} />
			<KeyValueItem label={"Run On"} value={props.script.runOn} />
		</box>
	);
}
