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

export default async function (command: AddReleaseToDaemonByIdCommand): Promise<AddReleaseToDaemonByIdResult> {
	const { modId, releaseId, form } = command;

	const health = await getDaemonHealth();

	if (health.status !== StatusCodes.OK || !health.data) {
		return err("FailedToGetHealth");
	}

	const mod = await getModById(modId);
	if (mod.status !== StatusCodes.OK || !mod.data) {
		return err("FailedToGetMod");
	}

	const release = await getModReleaseById(modId, releaseId);
	if (release.status !== StatusCodes.OK || !release.data) {
		return err("FailedToGetRelease");
	}

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
		return err("FailedToAddReleaseToDaemon");
	}

	if (!form) {
		await registerModReleaseDownloadById(mod.data.mod.id, release.data.id, {
			daemonInstanceId: health.data.daemonInstanceId,
		});
	}

	return ok(undefined);
}
