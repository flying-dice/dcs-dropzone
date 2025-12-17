import getDebug from "debug";
import { StatusCodes } from "http-status-codes";
import { err, ok, type Result } from "neverthrow";
import { getModById, getModReleaseById, registerModReleaseDownloadById } from "../_autogen/api.ts";
import { addReleaseToDaemon, getDaemonHealth } from "../_autogen/daemon_api.ts";
import type { UserModReleaseForm } from "../pages/UserModReleasePage/form.ts";

export type AddReleaseToDaemonByIdCommand = {
	modId: string;
	releaseId: string;
	form?: UserModReleaseForm;
};

export type AddReleaseToDaemonByIdResult = Result<
	void,
	"FailedToGetHealth" | "FailedToGetMod" | "FailedToGetRelease" | "FailedToAddReleaseToDaemon"
>;

const debug = getDebug("AddReleaseToDaemonByIdCommand");

export default async function (command: AddReleaseToDaemonByIdCommand): Promise<AddReleaseToDaemonByIdResult> {
	const { modId, releaseId, form } = command;

	const health = await getDaemonHealth();

	if (health.status !== StatusCodes.OK || !health.data) {
		debug("Failed to get daemon health", health);
		return err("FailedToGetHealth");
	}

	const mod = await getModById(modId);
	if (mod.status !== StatusCodes.OK || !mod.data) {
		debug("Failed to get mod", mod);
		return err("FailedToGetMod");
	}

	const release = await getModReleaseById(modId, releaseId);
	if (release.status !== StatusCodes.OK || !release.data) {
		debug("Failed to get release", release);
		return err("FailedToGetRelease");
	}

	debug(`Requesting daemon to add releaseId: ${releaseId} for modId: ${modId}`);

	const result = await addReleaseToDaemon({
		modId: mod.data.mod.id,
		releaseId: release.data.id,
		modName: mod.data.mod.name,
		version: form?.values.version || release.data.version,
		versionHash: release.data.versionHash,
		assets: form?.values.assets || release.data.assets,
		dependencies: mod.data.mod.dependencies,
		missionScripts: form?.values.missionScripts || release.data.missionScripts,
		symbolicLinks: form?.values.symbolicLinks || release.data.symbolicLinks,
	});

	if (result.status !== StatusCodes.OK) {
		debug("Failed to add release to daemon", result);
		return err("FailedToAddReleaseToDaemon");
	}

	if (!form) {
		debug("Adding Mod Release Download Count");
		await registerModReleaseDownloadById(mod.data.mod.id, release.data.id, {
			daemonInstanceId: health.data.daemonInstanceId,
		});
	}

	return ok(undefined);
}
