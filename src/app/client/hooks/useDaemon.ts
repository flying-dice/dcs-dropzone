import { useAsync, useAsyncFn } from "react-use";
import {
	getModUpdatesByIds,
	type ModData,
	type ModReleaseData,
} from "../_autogen/api.ts";
import {
	addReleaseToDaemon,
	disableRelease,
	enableRelease,
	ModAndReleaseDataStatus,
	removeReleaseFromDaemon,
	useGetAllDaemonReleases,
} from "../_autogen/daemon_api.ts";
import { configureDaemon } from "../_autogen/daemon_fetch_client.ts";
import { useAppTranslation } from "../i18n/useAppTranslation.ts";
import type { UserModReleaseForm } from "../pages/UserModReleasePage/form.ts";
import { showErrorNotification } from "../utils/showErrorNotification.tsx";
import { showSuccessNotification } from "../utils/showSuccessNotification.tsx";

export function useDaemonDownloads() {
	const daemonReleases = useGetAllDaemonReleases({
		query: { refetchInterval: 1000 },
	});

	const latestVersions = useAsync(
		() =>
			getModUpdatesByIds({
				ids: (daemonReleases.data?.data.map((it) => it.modId) || []).join(","),
			}),
		[daemonReleases.data],
	);

	const enabled = daemonReleases.data?.data.filter(
		(it) => it.status === ModAndReleaseDataStatus.ENABLED,
	);

	return {
		enabledCount: enabled?.length,
		enabled,
		downloads: daemonReleases.data?.data,
		downloadCount: daemonReleases.data?.data.length,
		latestVersions,
		refetch: daemonReleases.refetch,
		active: daemonReleases.data?.data.filter(
			(it) => it.status === ModAndReleaseDataStatus.IN_PROGRESS,
		),
		isActive:
			daemonReleases.data?.data.some(
				(it) => it.status === ModAndReleaseDataStatus.IN_PROGRESS,
			) ?? false,
		configureDaemon,
	};
}

export function useDaemonDownloader(
	mod: ModData,
	release: ModReleaseData,
	form?: UserModReleaseForm,
) {
	const { t } = useAppTranslation();
	const daemonReleases = useGetAllDaemonReleases({
		query: { refetchInterval: 1000 },
	});

	const [adding, add] = useAsyncFn(async () => {
		try {
			await addReleaseToDaemon({
				modId: mod.id,
				releaseId: release.id,
				modName: mod.name,
				version: form?.values.version || release.version,
				assets: form?.values.assets || release.assets,
				dependencies: mod.dependencies,
				missionScripts: form?.values.missionScripts || release.missionScripts,
				symbolicLinks: form?.values.symbolicLinks || release.symbolicLinks,
			});
			await daemonReleases.refetch();
			showSuccessNotification(
				t("ADDED_SUCCESS_TITLE"),
				t("ADDED_SUCCESS_DESC"),
			);
		} catch (e) {
			showErrorNotification(e);
		}
	}, [form, mod, t, release]);

	const [removing, remove] = useAsyncFn(async () => {
		try {
			await removeReleaseFromDaemon(release.id);
			await daemonReleases.refetch();
			showSuccessNotification(
				t("REMOVE_SUCCESS_TITLE"),
				t("REMOVE_SUCCESS_DESC"),
			);
		} catch (e) {
			showErrorNotification(e);
		}
	}, [form, mod, t, release]);

	const [toggling, toggle] = useAsyncFn(async () => {
		try {
			const subscription = daemonReleases.data?.data.find(
				(it) => it.releaseId === release.id,
			);

			if (!subscription) return;

			if (subscription.status === ModAndReleaseDataStatus.ENABLED) {
				await disableRelease(release.id);
				showSuccessNotification(
					"Success",
					"Mod release has been disabled successfully.",
				);
			} else {
				await enableRelease(release.id);
				showSuccessNotification(
					"Success",
					"Mod release has been enabled successfully.",
				);
			}
		} catch (e) {
			showErrorNotification(e);
		}
	}, [release, daemonReleases]);

	return {
		isAvailable: daemonReleases.isSuccess,
		isUnavailable: !daemonReleases.isSuccess,
		adding,
		add,
		removing,
		remove,
		toggling,
		toggle,
		configureDaemon,
		daemonRelease: daemonReleases.data?.data.find(
			(it) => it.releaseId === release.id,
		),
		isReady() {
			const sub = daemonReleases.data?.data.find(
				(it) => it.releaseId === release.id,
			);
			return (
				sub?.status === ModAndReleaseDataStatus.ENABLED ||
				sub?.status === ModAndReleaseDataStatus.DISABLED
			);
		},
	};
}
