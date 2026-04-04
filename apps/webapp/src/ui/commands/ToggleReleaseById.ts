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
			const data = disableResponse.data as { reason?: string; systemError?: string };
			const reason = data?.reason;
			const systemError = data?.systemError;
			const message = systemError ? `${reason}: ${systemError}` : (reason ?? "Failed to disable release");
			return [undefined, new ToggleReleaseError(message)];
		}
		return ["Disabled", null];
	}

	const enableResponse = await enableRelease(releaseId);
	if (enableResponse.status !== StatusCodes.OK) {
		const data = enableResponse.data as { reason?: string; systemError?: string };
		const reason = data?.reason;
		const systemError = data?.systemError;
		const message = systemError ? `${reason}: ${systemError}` : (reason ?? "Failed to enable release");
		return [undefined, new ToggleReleaseError(message)];
	}
	return ["Enabled", null];
}
