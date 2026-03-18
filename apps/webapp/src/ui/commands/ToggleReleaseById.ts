import { disableRelease, enableRelease, getAllDaemonReleases, ModAndReleaseDataStatus } from "@packages/clients/daemon";
import { StatusCodes } from "http-status-codes";
import { type Err, err, type Ok, ok, type Result } from "neverthrow";
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
		return await disableRelease(releaseId)
			.then((): Ok<"Disabled", never> => ok("Disabled"))
			.catch((e): Err<never, ToggleReleaseError> => err(new ToggleReleaseError(String(e.message))));
	}

	return await enableRelease(releaseId)
		.then((): Ok<"Enabled", never> => ok("Enabled"))
		.catch((e): Err<never, ToggleReleaseError> => err(new ToggleReleaseError(String(e.message))));
}
