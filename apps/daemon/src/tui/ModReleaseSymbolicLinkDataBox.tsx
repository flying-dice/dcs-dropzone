import type { ModReleaseSymbolicLinkData } from "../schemas/ModAndReleaseData.ts";
import { KeyValueItem } from "./KeyValueItem.tsx";

export type ModReleaseSymbolicLinkDataBoxProps = { link: ModReleaseSymbolicLinkData };
export function ModReleaseSymbolicLinkDataBox(props: ModReleaseSymbolicLinkDataBoxProps) {
	return (
		<box marginLeft={1} title={props.link.name} flexDirection={"column"} borderStyle={"rounded"} borderColor={"gray"}>
			<KeyValueItem label={"Source"} value={props.link.src} />
			<KeyValueItem label={"Destination"} value={props.link.dest} />
			<KeyValueItem label={"Destination Root"} value={props.link.destRoot} />
		</box>
	);
}
