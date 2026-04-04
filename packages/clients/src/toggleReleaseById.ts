import { StatusCodes } from "http-status-codes";
import { DropzoneClientError } from "./DropzoneClientError.ts";
import { getAllDaemonReleases, ModAndReleaseDataStatus, toggleRelease } from "./daemon";

export class FailedToGetDaemonReleasesError extends DropzoneClientError {
	readonly type = "FailedToGetDaemonReleasesError" as const;
}

export class FailedToFindDaemonReleaseError extends DropzoneClientError {
	readonly type = "FailedToFindDaemonReleaseError" as const;
}

export class ToggleReleaseError extends DropzoneClientError {
	readonly type = "ToggleReleaseError" as const;
}

export type ToggleReleaseByIdResultError =
	| FailedToGetDaemonReleasesError
	| FailedToFindDaemonReleaseError
	| ToggleReleaseError;

export async function toggleReleaseById(props: {
	releaseId: string;
}): Promise<["Enabled" | "Disabled", null] | [undefined, ToggleReleaseByIdResultError]> {
	const { releaseId } = props;

	const releases = await getAllDaemonReleases();
	if (releases.status !== StatusCodes.OK || !releases.data) {
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
				status: StatusCodes.NOT_FOUND,
			}),
		];
	}

	const wasEnabled = release.status === ModAndReleaseDataStatus.ENABLED;

	const result = await toggleRelease(releaseId);
	if (result.status !== StatusCodes.OK) {
		return [
			undefined,
			new ToggleReleaseError({
				message: "Failed to toggle release",
				data: result.data,
				status: result.status,
			}),
		];
	}

	return [wasEnabled ? "Disabled" : "Enabled", null];
}
