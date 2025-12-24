import { DownloadedReleaseStatus } from "../enums/DownloadedReleaseStatus.ts";
import type { ModAndReleaseData } from "../schemas/ModAndReleaseData.ts";
import { DownloadedReleaseStatusIcon } from "./DownloadedReleaseStatusIcon.tsx";
import { NavbarItem } from "./NavbarItem.tsx";

export type NavbarProps = {
	selected?: ModAndReleaseData;
	releases: ModAndReleaseData[];
};
export function Navbar(props: NavbarProps) {
	return (
		<box padding={1} height={"100%"} width={40} maxWidth={40} title={"Mods (↑↓)"}>
			{props.releases.map((release) => (
				<NavbarItem
					key={release.releaseId + release.overallPercentProgress + release.status}
					active={props.selected?.releaseId === release.releaseId}
					label={`${release.modName} ${release.version} `}
					dimmed={release.status === DownloadedReleaseStatus.DISABLED}
					icon={<DownloadedReleaseStatusIcon status={release.status} />}
				/>
			))}
		</box>
	);
}
