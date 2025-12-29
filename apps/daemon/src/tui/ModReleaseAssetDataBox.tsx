import { TextAttributes } from "@opentui/core";
import { match } from "ts-pattern";
import { AssetStatus } from "../application/enums/AssetStatus.ts";
import type { ModReleaseAssetData } from "../application/schemas/ModAndReleaseData.ts";
import { Group, Stack } from "./components.tsx";

export type ModReleaseAssetDataBoxProps = { asset: ModReleaseAssetData };

export function ModReleaseAssetDataBox(props: ModReleaseAssetDataBoxProps) {
	return (
		<Stack gap={0}>
			<text attributes={TextAttributes.UNDERLINE}>{props.asset.name}</text>
			<box paddingLeft={1}>
				<Group>
					<text attributes={TextAttributes.BOLD}>Status:</text>
					{match(props.asset.statusData)
						.when(
							(it) => it?.status === AssetStatus.COMPLETED,
							() => <text>Completed</text>,
						)
						.when(
							(it) => it?.status === AssetStatus.ERROR,
							() => <text>Error</text>,
						)
						.when(
							(it) => it?.status === AssetStatus.IN_PROGRESS,
							(it) => <text>{it?.overallPercentProgress}%</text>,
						)
						.otherwise(() => (
							<text>Pending</text>
						))}
				</Group>

				<box flexDirection={"column"}>
					<text attributes={TextAttributes.BOLD}>URLs:</text>
					{props.asset.urls.map((url) => (
						<text key={url} marginLeft={2} attributes={TextAttributes.ITALIC}>
							- {url}
						</text>
					))}
				</box>
			</box>
		</Stack>
	);
}
