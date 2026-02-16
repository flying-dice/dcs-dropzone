import { addReleaseToDaemon, getDaemonHealth } from "@packages/clients/daemon";
import {
	getModById,
	getModReleaseById,
	getUserModById,
	getUserModReleaseById,
	type ModData,
	type ModReleaseData,
	registerModReleaseDownloadById,
} from "@packages/clients/webapp";
import { StatusCodes } from "http-status-codes";
import { err, ok, type Result } from "neverthrow";
import type { UserModReleaseForm } from "../pages/UserModReleasePage/form.ts";

export type AddReleaseToDaemonByIdCommand = {
	modId: string;
	releaseId: string;
	form?: UserModReleaseForm;
	variant: "public" | "authenticated";
};

export type AddReleaseToDaemonByIdResult = Result<
	void,
	"FailedToGetHealth" | "FailedToGetMod" | "FailedToGetRelease" | "FailedToAddReleaseToDaemon"
>;

export default async function (command: AddReleaseToDaemonByIdCommand): Promise<AddReleaseToDaemonByIdResult> {
	const { modId, releaseId, form } = command;

	const health = await getDaemonHealth();
	let modData: ModData;
	let releaseData: ModReleaseData;

	if (health.status !== StatusCodes.OK || !health.data) {
		return err("FailedToGetHealth");
	}

	if (command.variant === "authenticated") {
		const userMod = await getUserModById(modId);
		if (userMod.status !== StatusCodes.OK || !userMod.data) {
			return err("FailedToGetMod");
		}
		modData = userMod.data;

		const userRelease = await getUserModReleaseById(modId, releaseId);
		if (userRelease.status !== StatusCodes.OK || !userRelease.data) {
			return err("FailedToGetRelease");
		}
		releaseData = userRelease.data;
	} else {
		const mod = await getModById(modId);
		if (mod.status !== StatusCodes.OK || !mod.data) {
			return err("FailedToGetMod");
		}
		modData = mod.data.mod;

		const release = await getModReleaseById(modId, releaseId);
		if (release.status !== StatusCodes.OK || !release.data) {
			return err("FailedToGetRelease");
		}
		releaseData = release.data;
	}

	const result = await addReleaseToDaemon({
		modId: modData.id,
		releaseId: releaseData.id,
		modName: modData.name,
		version: form?.values.version || releaseData.version,
		versionHash: releaseData.versionHash,
		assets: form?.values.assets || releaseData.assets,
		dependencies: modData.dependencies,
		missionScripts: form?.values.missionScripts || releaseData.missionScripts,
		symbolicLinks: form?.values.symbolicLinks || releaseData.symbolicLinks,
	});

	if (result.status !== StatusCodes.OK) {
		return err("FailedToAddReleaseToDaemon");
	}

	if (!form) {
		await registerModReleaseDownloadById(modData.id, releaseData.id, {
			daemonInstanceId: health.data.daemonInstanceId,
		});
	}

	return ok(undefined);
}
