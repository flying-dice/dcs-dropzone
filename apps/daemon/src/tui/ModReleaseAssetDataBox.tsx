import { TextAttributes } from "@opentui/core";
import type { ModReleaseAssetData } from "../schemas/ModAndReleaseData.ts";
import { KeyValueItem } from "./KeyValueItem.tsx";
import { toPercentOrDash } from "./utils.ts";

export type ModReleaseAssetDataBoxProps = { asset: ModReleaseAssetData };

export function ModReleaseAssetDataBox(props: ModReleaseAssetDataBoxProps) {
	const downloadProgress = toPercentOrDash(props.asset.statusData?.downloadPercentProgress);
	const extractProgress = toPercentOrDash(props.asset.statusData?.extractPercentProgress);

	return (
		<box marginLeft={1} title={props.asset.name} flexDirection={"column"} borderStyle={"rounded"} borderColor={"gray"}>
			<KeyValueItem label={"Download Progress"} value={downloadProgress} />
			<KeyValueItem label={"Extract Progress"} value={props.asset.isArchive ? extractProgress : "N/A"} />
			<KeyValueItem label={"Status"} value={props.asset.statusData?.status || "-"} />

			<box flexDirection={"column"}>
				<text attributes={TextAttributes.BOLD}>URLs:</text>
				{props.asset.urls.map((url) => (
					<text key={url} marginLeft={2} attributes={TextAttributes.ITALIC}>
						- {url}
					</text>
				))}
			</box>
		</box>
	);
}
