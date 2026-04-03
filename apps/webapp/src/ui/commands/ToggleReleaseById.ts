import { disableRelease, enableRelease, getAllDaemonReleases, ModAndReleaseDataStatus } from "@packages/clients/daemon";
import { StatusCodes } from "http-status-codes";
import { err, ok, type Result } from "neverthrow";
import {
	FailedToFindDaemonReleaseError,
	FailedToGetDaemonReleasesError,
	ToggleReleaseError,
} from "../../application/errors.ts";

export type ToggleReleaseByIdCommand = {
	releaseId: string;
};

export type ToggleReleaseByIdResult = Result<
	"Enabled" | "Disabled",
	FailedToGetDaemonReleasesError | FailedToFindDaemonReleaseError | ToggleReleaseError
>;

export default async function (command: ToggleReleaseByIdCommand): Promise<ToggleReleaseByIdResult> {
	const { releaseId } = command;

	const releases = await getAllDaemonReleases();

	if (releases.status !== StatusCodes.OK || !releases.data) {
		return err(new FailedToGetDaemonReleasesError());
	}

	const subscription = releases.data.find((it) => it.releaseId === releaseId);

	if (!subscription) {
		return err(new FailedToFindDaemonReleaseError());
	}

	if (subscription.status === ModAndReleaseDataStatus.ENABLED) {
		const disableResponse = await disableRelease(releaseId);
		if (disableResponse.status !== StatusCodes.OK) {
			const data = disableResponse.data as { error?: string };
			return err(new ToggleReleaseError(data?.error ?? "Failed to disable release"));
		}
		return ok("Disabled");
	}

	const enableResponse = await enableRelease(releaseId);
	if (enableResponse.status !== StatusCodes.OK) {
		const data = enableResponse.data as { error?: string };
		return err(new ToggleReleaseError(data?.error ?? "Failed to enable release"));
	}
	return ok("Enabled");
}
