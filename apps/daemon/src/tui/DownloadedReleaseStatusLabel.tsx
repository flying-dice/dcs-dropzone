import { DownloadedReleaseStatus } from "../application/enums/DownloadedReleaseStatus.ts";
import { DownloadedReleaseStatusIcon } from "./DownloadedReleaseStatusIcon.tsx";

export const DownloadedReleaseStatusColor: Record<DownloadedReleaseStatus, string> = {
	[DownloadedReleaseStatus.ENABLED]: "green",
	[DownloadedReleaseStatus.DISABLED]: "gray",
	[DownloadedReleaseStatus.PENDING]: "yellow",
	[DownloadedReleaseStatus.IN_PROGRESS]: "blue",
	[DownloadedReleaseStatus.ERROR]: "red",
};

export type DownloadedReleaseStatusLabelProps = {
	status?: DownloadedReleaseStatus;
};
export function DownloadedReleaseStatusLabel(props: DownloadedReleaseStatusLabelProps) {
	return (
		<box flexDirection={"row"}>
			<DownloadedReleaseStatusIcon status={props.status} />
			<text fg={props.status ? DownloadedReleaseStatusColor[props.status] : undefined}>
				{props.status ?? "UNKNOWN"}
			</text>
		</box>
	);
}
