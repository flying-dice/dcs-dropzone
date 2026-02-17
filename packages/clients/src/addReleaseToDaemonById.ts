import { StatusCodes } from "http-status-codes";
import { addReleaseToDaemon, getDaemonHealth, type ModAndReleaseData } from "./daemon";
import {
	getModById,
	getModReleaseById,
	getUserModById,
	getUserModReleaseById,
	type ModData,
	type ModReleaseData,
	registerModReleaseDownloadById,
} from "./webapp";

export type AddReleaseToDaemonByIdProps = {
	modId: string;
	releaseId: string;
	data?: Pick<ModAndReleaseData, "version" | "assets" | "missionScripts" | "symbolicLinks">;
};

export async function addReleaseToDaemonById(
	isUserMod = false,
	props: AddReleaseToDaemonByIdProps,
): Promise<"FailedToGetHealth" | "FailedToGetMod" | "FailedToGetRelease" | "FailedToAddReleaseToDaemon" | void> {
	const { modId, releaseId, data } = props;

	const health = await getDaemonHealth();
	let modData: ModData;
	let releaseData: ModReleaseData;

	if (health.status !== StatusCodes.OK || !health.data) {
		return "FailedToGetHealth";
	}

	if (isUserMod) {
		const userMod = await getUserModById(modId);
		if (userMod.status !== StatusCodes.OK || !userMod.data) {
			return "FailedToGetMod";
		}
		modData = userMod.data;

		const userRelease = await getUserModReleaseById(modId, releaseId);
		if (userRelease.status !== StatusCodes.OK || !userRelease.data) {
			return "FailedToGetRelease";
		}
		releaseData = userRelease.data;
	} else {
		const mod = await getModById(modId);
		if (mod.status !== StatusCodes.OK || !mod.data) {
			return "FailedToGetMod";
		}
		modData = mod.data.mod;

		const release = await getModReleaseById(modId, releaseId);
		if (release.status !== StatusCodes.OK || !release.data) {
			return "FailedToGetRelease";
		}
		releaseData = release.data;
	}

	const result = await addReleaseToDaemon({
		modId: modData.id,
		releaseId: releaseData.id,
		modName: modData.name,
		version: data?.version || releaseData.version,
		versionHash: releaseData.versionHash,
		assets: data?.assets || releaseData.assets,
		dependencies: modData.dependencies,
		missionScripts: data?.missionScripts || releaseData.missionScripts,
		symbolicLinks: data?.symbolicLinks || releaseData.symbolicLinks,
	});

	if (result.status !== StatusCodes.OK) {
		return "FailedToAddReleaseToDaemon";
	}

	if (!data) {
		await registerModReleaseDownloadById(modData.id, releaseData.id, {
			daemonInstanceId: health.data.daemonInstanceId,
		});
	}
}
