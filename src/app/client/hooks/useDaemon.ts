import { StatusCodes } from "http-status-codes";
import { useAsync, useAsyncFn } from "react-use";
import { getModUpdatesByIds } from "../_autogen/api.ts";
import { ModAndReleaseDataStatus, removeReleaseFromDaemon, useGetAllDaemonReleases } from "../_autogen/daemon_api.ts";
import addReleaseToDaemonById from "../commands/AddReleaseToDaemonById.ts";
import toggleReleaseById from "../commands/ToggleReleaseById.ts";
import { useAppTranslation } from "../i18n/useAppTranslation.ts";
import type { UserModReleaseForm } from "../pages/UserModReleasePage/form.ts";
import { showErrorNotification } from "../utils/showErrorNotification.tsx";
import { showSuccessNotification } from "../utils/showSuccessNotification.tsx";

export function useDaemon() {
	const { t } = useAppTranslation();
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

	const enabled = daemonReleases.data?.data.filter((it) => it.status === ModAndReleaseDataStatus.ENABLED);

	const outdated = daemonReleases?.data?.data.filter((it) => {
		const latest =
			latestVersions.value?.status === StatusCodes.OK &&
			latestVersions.value?.data.find((mod) => mod.mod_id === it.modId);
		if (!latest) return false;
		return latest.version !== it.version;
	});

	const [adding, add] = useAsyncFn(
		async (modId: string, releaseId: string, form?: UserModReleaseForm) => {
			const result = await addReleaseToDaemonById({ releaseId, modId, form });
			result.match(
				() => showSuccessNotification(t("ADDED_SUCCESS_TITLE"), t("ADDED_SUCCESS_DESC")),
				(error) => showErrorNotification(new Error(t("ERROR_TAKING_ACTION", { error }))),
			);
			await daemonReleases.refetch();
		},
		[t, daemonReleases],
	);

	const [removing, remove] = useAsyncFn(
		async (releaseId: string) => {
			try {
				await removeReleaseFromDaemon(releaseId);
				await daemonReleases.refetch();
				showSuccessNotification(t("REMOVE_SUCCESS_TITLE"), t("REMOVE_SUCCESS_DESC"));
			} catch (e) {
				showErrorNotification(e);
			}
		},
		[t, daemonReleases],
	);

	const [toggling, toggle] = useAsyncFn(
		async (releaseId: string) => {
			const result = await toggleReleaseById({ releaseId });
			result.match(
				(ok) => {
					if (ok === "Enabled") showSuccessNotification(t("MOD_ENABLED_SUCCESS_TITLE"), t("MOD_ENABLED_SUCCESS_DESC"));
					else if (ok === "Disabled")
						showSuccessNotification(t("MOD_DISABLED_SUCCESS_TITLE"), t("MOD_DISABLED_SUCCESS_DESC"));
				},
				(error) => showErrorNotification(new Error(t("ERROR_TAKING_ACTION", { error }))),
			);
			await daemonReleases.refetch();
		},
		[t, daemonReleases],
	);

	const [updating, update] = useAsyncFn(
		async (modId: string, currentReleaseId: string, latestReleaseId: string) => {
			try {
				const result = await addReleaseToDaemonById({ releaseId: latestReleaseId, modId });
				result.match(
					() => showSuccessNotification(t("ADDED_SUCCESS_TITLE"), t("ADDED_SUCCESS_DESC")),
					(error) => showErrorNotification(new Error(t("ERROR_TAKING_ACTION", { error }))),
				);

				await removeReleaseFromDaemon(currentReleaseId);
				await daemonReleases.refetch();
			} catch (e) {
				showErrorNotification(e);
			}
		},
		[t, daemonReleases],
	);

	return {
		enabledCount: enabled?.length,
		enabled,
		downloads: daemonReleases.data?.data,
		downloadCount: daemonReleases.data?.data.length,
		outdatedCount: outdated?.length,
		outdated,
		latestVersions,
		refetch: daemonReleases.refetch,
		active: daemonReleases.data?.data.filter((it) => it.status === ModAndReleaseDataStatus.IN_PROGRESS),
		isActive: daemonReleases.data?.data.some((it) => it.status === ModAndReleaseDataStatus.IN_PROGRESS) ?? false,
		isFetching: daemonReleases.isFetching,
		isSuccess: daemonReleases.isSuccess,
		isError: daemonReleases.isError,
		error: daemonReleases.error,
		isAvailable: daemonReleases.isSuccess,
		isUnavailable: !daemonReleases.isSuccess,
		adding,
		add,
		removing,
		remove,
		toggling,
		toggle,
		updating,
		update,
	};
}
