import { StatusCodes } from "http-status-codes";
import { DropzoneClientError } from "./DropzoneClientError.ts";
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

export class FailedToGetHealthError extends DropzoneClientError {}

export class FailedToGetModError extends DropzoneClientError {}

export class FailedToGetReleaseError extends DropzoneClientError {}

export class FailedToAddReleaseToDaemonError extends DropzoneClientError {}

export class DropzoneModsDirNotConfiguredError extends DropzoneClientError {}

export type AddReleaseToDaemonError =
	| FailedToGetHealthError
	| FailedToGetModError
	| FailedToGetReleaseError
	| FailedToAddReleaseToDaemonError
	| DropzoneModsDirNotConfiguredError;

export type AddReleaseToDaemonByIdProps = {
	modId: string;
	releaseId: string;
	data?: Pick<ModAndReleaseData, "version" | "assets" | "missionScripts" | "symbolicLinks">;
};

export async function addReleaseToDaemonById(
	isUserMod = false,
	props: AddReleaseToDaemonByIdProps,
): Promise<[void, null] | [undefined, AddReleaseToDaemonError]> {
	const { modId, releaseId, data } = props;

	const health = await getDaemonHealth();
	let modData: ModData;
	let releaseData: ModReleaseData;

	if (health.status !== StatusCodes.OK || !health.data) {
		return [
			undefined,
			new FailedToGetHealthError({
				message: "Failed to get daemon health",
				data: health.data,
				status: health.status,
			}),
		];
	}

	if (isUserMod) {
		const userMod = await getUserModById(modId);
		if (userMod.status !== StatusCodes.OK || !userMod.data) {
			return [
				undefined,
				new FailedToGetModError({
					message: "Failed to get user mod",
					data: userMod.data,
					status: userMod.status,
				}),
			];
		}
		modData = userMod.data;

		const userRelease = await getUserModReleaseById(modId, releaseId);
		if (userRelease.status !== StatusCodes.OK || !userRelease.data) {
			return [
				undefined,
				new FailedToGetReleaseError({
					message: "Failed to get user mod release",
					data: userRelease.data,
					status: userRelease.status,
				}),
			];
		}
		releaseData = userRelease.data;
	} else {
		const mod = await getModById(modId);
		if (mod.status !== StatusCodes.OK || !mod.data) {
			return [
				undefined,
				new FailedToGetModError({
					message: "Failed to get mod",
					data: mod.data,
					status: mod.status,
				}),
			];
		}
		modData = mod.data.mod;

		const release = await getModReleaseById(modId, releaseId);
		if (release.status !== StatusCodes.OK || !release.data) {
			return [
				undefined,
				new FailedToGetReleaseError({
					message: "Failed to get mod release",
					data: release.data,
					status: release.status,
				}),
			];
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
		return [
			undefined,
			result.data.reason === "DropzoneModsDirNotConfigured"
				? new DropzoneModsDirNotConfiguredError({
						message: "Failed to add release to daemon because mods directory is not configured",
						data: result.data,
						status: result.status,
					})
				: new FailedToAddReleaseToDaemonError({
						message: "Failed to add release to daemon",
						data: result.data,
						status: result.status,
					}),
		];
	}

	if (!data) {
		await registerModReleaseDownloadById(modData.id, releaseData.id, {
			daemonInstanceId: health.data.daemonInstanceId,
		});
	}

	return [undefined, null];
}
