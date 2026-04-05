import { disableRelease, enableRelease, getAllDaemonReleases, ModAndReleaseDataStatus } from "@packages/clients/daemon";
import { StatusCodes } from "http-status-codes";
import {
	FailedToFindDaemonReleaseError,
	FailedToGetDaemonReleasesError,
	ToggleReleaseError,
} from "../../application/errors.ts";

export type ToggleReleaseByIdCommand = {
	releaseId: string;
};

export type ToggleReleaseByIdResult =
	| ["Enabled" | "Disabled", null]
	| [undefined, FailedToGetDaemonReleasesError | FailedToFindDaemonReleaseError | ToggleReleaseError];

export default async function (command: ToggleReleaseByIdCommand): Promise<ToggleReleaseByIdResult> {
	const { releaseId } = command;

	const releases = await getAllDaemonReleases();

	if (releases.status !== StatusCodes.OK || !releases.data) {
		return [undefined, new FailedToGetDaemonReleasesError()];
	}

	const subscription = releases.data.find((it) => it.releaseId === releaseId);

	if (!subscription) {
		return [undefined, new FailedToFindDaemonReleaseError()];
	}

	if (subscription.status === ModAndReleaseDataStatus.ENABLED) {
		const disableResponse = await disableRelease(releaseId);
		if (disableResponse.status !== StatusCodes.OK) {
			return [
				undefined,
				new ToggleReleaseError(extractErrorMessage(disableResponse.data, "Failed to disable release")),
			];
		}
		return ["Disabled", null];
	}

	const enableResponse = await enableRelease(releaseId);
	if (enableResponse.status !== StatusCodes.OK) {
		return [undefined, new ToggleReleaseError(extractErrorMessage(enableResponse.data, "Failed to enable release"))];
	}
	return ["Enabled", null];
}

function extractErrorMessage(data: unknown, fallback: string): string {
	const errorData = data as {
		reason?: string;
		systemError?: string;
		failures?: { linkId: string; message: string }[];
	};
	const reason = errorData?.reason;
	if (!reason) return fallback;
	const detail = errorData?.systemError ?? errorData?.failures?.map((f) => `${f.linkId}: ${f.message}`).join("; ");
	return detail ? `${reason}: ${detail}` : reason;
}
