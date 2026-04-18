import { DropzoneClientError } from "./DropzoneClientError.ts";
import {
	getAllDaemonReleases,
	type getAllDaemonReleasesResponse,
	ModAndReleaseDataStatus,
	toggleRelease,
} from "./daemon";

export class FailedToGetDaemonReleasesError extends DropzoneClientError {
	readonly type = "FailedToGetDaemonReleasesError" as const;
}

export class FailedToFindDaemonReleaseError extends DropzoneClientError {
	readonly type = "FailedToFindDaemonReleaseError" as const;
}

export class ToggleReleaseError extends DropzoneClientError {
	readonly type = "ToggleReleaseError" as const;

	/**
	 * The structured error reason from the daemon API (e.g. "ReleaseNotFound", "SymlinkCreationFailed").
	 * Available when the daemon returns a 422 with structured error data.
	 */
	get reason(): string | undefined {
		return (this.data as { reason?: string })?.reason;
	}
}

export type ToggleReleaseByIdResultError =
	| FailedToGetDaemonReleasesError
	| FailedToFindDaemonReleaseError
	| ToggleReleaseError;

export async function toggleReleaseById(props: {
	releaseId: string;
}): Promise<["Enabled" | "Disabled", null] | [undefined, ToggleReleaseByIdResultError]> {
	const { releaseId } = props;

	let releases: getAllDaemonReleasesResponse;
	try {
		releases = await getAllDaemonReleases();
	} catch (e) {
		return [
			undefined,
			new FailedToGetDaemonReleasesError({
				message: "Failed to get daemon releases",
				data: e instanceof DropzoneClientError ? e.data : undefined,
				status: e instanceof DropzoneClientError ? e.status : 0,
			}),
		];
	}

	if (!releases.data) {
		return [
			undefined,
			new FailedToGetDaemonReleasesError({
				message: "Failed to get daemon releases",
				data: releases.data,
				status: releases.status,
			}),
		];
	}

	const release = releases.data.find((r) => r.releaseId === releaseId);
	if (!release) {
		return [
			undefined,
			new FailedToFindDaemonReleaseError({
				message: `Release '${releaseId}' not found in daemon`,
				data: undefined,
				status: 404,
			}),
		];
	}

	const wasEnabled = release.status === ModAndReleaseDataStatus.ENABLED;

	try {
		await toggleRelease(releaseId);
	} catch (e) {
		if (e instanceof DropzoneClientError) {
			const errorData = e.data as {
				reason?: string;
				systemError?: string;
				failures?: { linkId: string; message: string }[];
			};
			const reason = errorData?.reason;
			const detail = errorData?.systemError ?? errorData?.failures?.map((f) => `${f.linkId}: ${f.message}`).join("; ");
			const message = detail
				? reason
					? `${reason}: ${detail}`
					: `Failed to toggle release: ${detail}`
				: (reason ?? "Failed to toggle release");
			return [
				undefined,
				new ToggleReleaseError({
					message,
					data: e.data,
					status: e.status,
				}),
			];
		}
		return [
			undefined,
			new ToggleReleaseError({
				message: "Failed to toggle release",
				data: undefined,
				status: 0,
			}),
		];
	}

	return [wasEnabled ? "Disabled" : "Enabled", null];
}
