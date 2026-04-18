import { DropzoneClientError } from "./DropzoneClientError.ts";
import { addReleaseToDaemon, getDaemonHealth, type getDaemonHealthResponse, type ModAndReleaseData } from "./daemon";
import {
	getModById,
	type getModByIdResponse,
	getModReleaseById,
	type getModReleaseByIdResponse,
	getUserModById,
	type getUserModByIdResponse,
	getUserModReleaseById,
	type getUserModReleaseByIdResponse,
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

	let health: getDaemonHealthResponse;
	try {
		health = await getDaemonHealth();
	} catch (e) {
		return [
			undefined,
			new FailedToGetHealthError({
				message: "Failed to get daemon health",
				data: e instanceof DropzoneClientError ? e.data : undefined,
				status: e instanceof DropzoneClientError ? e.status : 0,
			}),
		];
	}

	if (!health.data) {
		return [
			undefined,
			new FailedToGetHealthError({
				message: "Failed to get daemon health",
				data: health.data,
				status: health.status,
			}),
		];
	}

	let modData: ModData;
	let releaseData: ModReleaseData;

	if (isUserMod) {
		let userMod: getUserModByIdResponse;
		try {
			userMod = await getUserModById(modId);
		} catch (e) {
			return [
				undefined,
				new FailedToGetModError({
					message: "Failed to get user mod",
					data: e instanceof DropzoneClientError ? e.data : undefined,
					status: e instanceof DropzoneClientError ? e.status : 0,
				}),
			];
		}
		if (!userMod.data) {
			return [
				undefined,
				new FailedToGetModError({
					message: "Failed to get user mod",
					data: userMod.data,
					status: userMod.status,
				}),
			];
		}
		modData = userMod.data as ModData;

		let userRelease: getUserModReleaseByIdResponse;
		try {
			userRelease = await getUserModReleaseById(modId, releaseId);
		} catch (e) {
			return [
				undefined,
				new FailedToGetReleaseError({
					message: "Failed to get user mod release",
					data: e instanceof DropzoneClientError ? e.data : undefined,
					status: e instanceof DropzoneClientError ? e.status : 0,
				}),
			];
		}
		if (!userRelease.data) {
			return [
				undefined,
				new FailedToGetReleaseError({
					message: "Failed to get user mod release",
					data: userRelease.data,
					status: userRelease.status,
				}),
			];
		}
		releaseData = userRelease.data as ModReleaseData;
	} else {
		let mod: getModByIdResponse;
		try {
			mod = await getModById(modId);
		} catch (e) {
			return [
				undefined,
				new FailedToGetModError({
					message: "Failed to get mod",
					data: e instanceof DropzoneClientError ? e.data : undefined,
					status: e instanceof DropzoneClientError ? e.status : 0,
				}),
			];
		}
		if (!mod.data) {
			return [
				undefined,
				new FailedToGetModError({
					message: "Failed to get mod",
					data: mod.data,
					status: mod.status,
				}),
			];
		}
		modData = (mod.data as { mod: ModData }).mod;

		let release: getModReleaseByIdResponse;
		try {
			release = await getModReleaseById(modId, releaseId);
		} catch (e) {
			return [
				undefined,
				new FailedToGetReleaseError({
					message: "Failed to get mod release",
					data: e instanceof DropzoneClientError ? e.data : undefined,
					status: e instanceof DropzoneClientError ? e.status : 0,
				}),
			];
		}
		if (!release.data) {
			return [
				undefined,
				new FailedToGetReleaseError({
					message: "Failed to get mod release",
					data: release.data,
					status: release.status,
				}),
			];
		}
		releaseData = release.data as ModReleaseData;
	}

	try {
		await addReleaseToDaemon({
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
	} catch (e) {
		if (e instanceof DropzoneClientError) {
			return [
				undefined,
				e.data?.reason === "DropzoneModsDirNotConfigured"
					? new DropzoneModsDirNotConfiguredError({
							message: "Failed to add release to daemon because mods directory is not configured",
							data: e.data,
							status: e.status,
						})
					: new FailedToAddReleaseToDaemonError({
							message: "Failed to add release to daemon",
							data: e.data,
							status: e.status,
						}),
			];
		}
		return [
			undefined,
			new FailedToAddReleaseToDaemonError({
				message: "Failed to add release to daemon",
				data: undefined,
				status: 0,
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
