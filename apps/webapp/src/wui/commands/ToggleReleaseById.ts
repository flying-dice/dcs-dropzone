import getDebug from "debug";
import { StatusCodes } from "http-status-codes";
import { type Err, err, type Ok, ok, type Result } from "neverthrow";
import {
	disableRelease,
	enableRelease,
	getAllDaemonReleases,
	ModAndReleaseDataStatus,
} from "../_autogen/daemon_api.ts";

export type ToggleReleaseByIdCommand = {
	releaseId: string;
};

export type ToggleReleaseByIdResult = Result<
	"Enabled" | "Disabled",
	"FailedToGetDaemonReleases" | "FailedToFindDaemonRelease" | string
>;

const debug = getDebug("ToggleReleaseByIdCommand");

export default async function (command: ToggleReleaseByIdCommand): Promise<ToggleReleaseByIdResult> {
	const { releaseId } = command;

	const releases = await getAllDaemonReleases();

	if (releases.status !== StatusCodes.OK || !releases.data) {
		debug("Failed to get daemon releases", releases);
		return err("FailedToGetDaemonReleases");
	}

	const subscription = releases.data.find((it) => it.releaseId === releaseId);

	if (!subscription) {
		debug(`ReleaseId: ${releaseId} is not present in daemon.`);
		return err("FailedToFindDaemonRelease");
	}

	if (subscription.status === ModAndReleaseDataStatus.ENABLED) {
		return await disableRelease(releaseId)
			.then((): Ok<"Disabled", never> => ok("Disabled"))
			.catch((e): Err<never, string> => err(String(e.message)));
	}

	return await enableRelease(releaseId)
		.then((): Ok<"Enabled", never> => ok("Enabled"))
		.catch((e): Err<never, string> => err(String(e.message)));
}
