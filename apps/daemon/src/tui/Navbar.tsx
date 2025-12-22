import { TextAttributes } from "@opentui/core";
import type { ModAndReleaseData } from "../schemas/ModAndReleaseData.ts";
import { Button } from "./Button.tsx";
import { DownloadedReleaseStatusIcon } from "./DownloadedReleaseStatusIcon.tsx";

export type NavbarProps = {
	selected?: ModAndReleaseData;
	releases: ModAndReleaseData[];
};
export function Navbar(props: NavbarProps) {
	return (
		<box height={"100%"} width={40} maxWidth={40} border title={"Mods (↑↓)"}>
			{props.releases.map((release) => (
				<Button
					height={4}
					key={release.releaseId + release.overallPercentProgress + release.status}
					active={props.selected?.releaseId === release.releaseId}
				>
					<box flexDirection={"row"}>
						<DownloadedReleaseStatusIcon status={release.status} />
						<text>{release.modName}</text>
					</box>
					<text attributes={TextAttributes.DIM}>{release.version}</text>
				</Button>
			))}
		</box>
	);
}
