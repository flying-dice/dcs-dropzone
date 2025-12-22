import { DownloadedReleaseStatus } from "../enums/DownloadedReleaseStatus.ts";

export const DownloadedReleaseStatusEmoji: Record<DownloadedReleaseStatus, string> = {
	[DownloadedReleaseStatus.PENDING]: "⏸️",
	[DownloadedReleaseStatus.IN_PROGRESS]: "⬇️",
	[DownloadedReleaseStatus.DISABLED]: "❌",
	[DownloadedReleaseStatus.ENABLED]: "✔️",
	[DownloadedReleaseStatus.ERROR]: "⚠️",
};

export type DownloadedReleaseStatusIconProps = {
	status?: DownloadedReleaseStatus;
};
export function DownloadedReleaseStatusIcon(props: DownloadedReleaseStatusIconProps) {
	return <text width={3}>{props.status ? DownloadedReleaseStatusEmoji[props.status] : "❔"}</text>;
}
