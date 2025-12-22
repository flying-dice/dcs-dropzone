import { TextAttributes } from "@opentui/core";
import { DownloadedReleaseStatus } from "../enums/DownloadedReleaseStatus.ts";
import type { ModAndReleaseData } from "../schemas/ModAndReleaseData.ts";
import { Button } from "./Button.tsx";
import { KeyValueItem } from "./KeyValueItem.tsx";
import { ModReleaseAssetDataBox } from "./ModReleaseAssetDataBox.tsx";
import { ModReleaseMissionScriptDataBox } from "./ModReleaseMissionScriptDataBox.tsx";
import { ModReleaseSymbolicLinkDataBox } from "./ModReleaseSymbolicLinkDataBox.tsx";

export type ModAndReleaseDataBoxProps = { data: ModAndReleaseData };
export function ModAndReleaseDataBox(props: ModAndReleaseDataBoxProps) {
	return (
		<box flexDirection={"column"} borderStyle={"single"} title={`${props.data.modName} v${props.data.version}`}>
			<scrollbox>
				<box flexGrow={1}>
					<KeyValueItem label={"Mod Name"} value={props.data.modName} />
					<KeyValueItem label={"Version"} value={props.data.version} />
					<KeyValueItem label={"Status"} value={props.data.status || "-"} />
					<KeyValueItem label={"Link"} value={`http://localhost:3000/#/mods/${props.data.modId}`} />
					<box marginTop={1}>
						<text attributes={TextAttributes.BOLD}>Actions:</text>
						<box marginLeft={2} flexDirection={"row"}>
							<Button active={props.data.status === DownloadedReleaseStatus.ENABLED} flexGrow={1}>
								<text>{props.data.status === DownloadedReleaseStatus.ENABLED ? "Enabled" : "Enable"} (E)</text>
							</Button>
							<Button active={props.data.status === DownloadedReleaseStatus.DISABLED} flexGrow={1}>
								<text>{props.data.status === DownloadedReleaseStatus.DISABLED ? "Disabled" : "Disable"} (D)</text>
							</Button>
							<Button flexGrow={1}>
								<text>Remove (R)</text>
							</Button>
						</box>
					</box>
					<box flexDirection={"column"} padding={1}>
						<text attributes={TextAttributes.BOLD}>Assets:</text>
						{props.data.assets.map((asset) => (
							<ModReleaseAssetDataBox key={asset.name} asset={asset} />
						))}
						{props.data.assets.length === 0 && (
							<text marginLeft={2} attributes={TextAttributes.ITALIC} fg={"gray"}>
								No assets configured.
							</text>
						)}
					</box>
					<box flexDirection={"column"} padding={1}>
						<text attributes={TextAttributes.BOLD}>Symbolic Links:</text>
						{props.data.symbolicLinks.map((link) => (
							<ModReleaseSymbolicLinkDataBox key={link.name} link={link} />
						))}
						{props.data.symbolicLinks.length === 0 && (
							<text marginLeft={2} attributes={TextAttributes.ITALIC} fg={"gray"}>
								No symbolic links configured.
							</text>
						)}
					</box>
					<box flexDirection={"column"} padding={1}>
						<text attributes={TextAttributes.BOLD}>Mission Scripts:</text>
						{props.data.missionScripts.map((script) => (
							<ModReleaseMissionScriptDataBox key={script.name} script={script} />
						))}
						{props.data.missionScripts.length === 0 && (
							<text marginLeft={2} attributes={TextAttributes.ITALIC} fg={"gray"}>
								No mission scripts configured.
							</text>
						)}
					</box>
				</box>
			</scrollbox>
		</box>
	);
}
