import * as assert from "node:assert";
import { addReleaseToDaemonById, calculateDashboardMetrics } from "@packages/clients";
import {
	getGetAllDaemonReleasesUrl,
	ModAndReleaseDataStatus,
	removeReleaseFromDaemon,
	useGetAllDaemonReleases,
} from "@packages/clients/daemon";
import {
	showDetailedErrorModal,
	showErrorNotification,
	showSuccessNotification,
	useAppTranslation,
} from "@packages/dzui";
import { StatusCodes } from "http-status-codes";
import { useAsync, useAsyncFn } from "react-use";
import toggleReleaseById from "../commands/ToggleReleaseById.ts";
import type { UserModReleaseForm } from "../pages/UserModReleasePage/form.ts";
import { useErrorModal } from "./useErrorModal.tsx";

export function useDaemon() {
	const { t } = useAppTranslation();
	const daemonReleases = useGetAllDaemonReleases({
		query: {
			queryKey: [getGetAllDaemonReleasesUrl()],
			refetchInterval: (q) => {
				if (
					q.state.data?.data.some(
						(it) => it.status === ModAndReleaseDataStatus.IN_PROGRESS || it.status === ModAndReleaseDataStatus.PENDING,
					)
				) {
					return 1000;
				} else {
					return false;
				}
			},
		},
	});

	const metrics = useAsync(
		() => calculateDashboardMetrics(daemonReleases.data?.status === 200 ? daemonReleases.data.data : undefined),
		[daemonReleases?.data?.data.map((it) => `${it.releaseId}_${it.status}`).join(",")],
	);

	const showError = useErrorModal();

	const [adding, add] = useAsyncFn(
		async (isUserMod: boolean, modId: string, releaseId: string, form?: UserModReleaseForm) => {
			const result = await addReleaseToDaemonById(isUserMod, { releaseId, modId, data: form?.values });

			result.match(
				() => showSuccessNotification(t("ADDED_SUCCESS_TITLE"), t("ADDED_SUCCESS_DESC")),
				(error) => {
					showDetailedErrorModal(t("ERROR"), error.message, JSON.stringify(error.data, null, 2));
				},
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
				(error) => showError(error.message),
			);
			await daemonReleases.refetch();
		},
		[t, daemonReleases],
	);

	const [updating, update] = useAsyncFn(
		async (isUserMod: boolean, modId: string, currentReleaseId: string, latestReleaseId: string) => {
			try {
				const removeRes = await removeReleaseFromDaemon(currentReleaseId);
				assert.ok(removeRes.status === StatusCodes.OK, "Failed to remove current release from daemon");

				const result = await addReleaseToDaemonById(isUserMod, { releaseId: latestReleaseId, modId });
				result.match(
					() => showSuccessNotification(t("ADDED_SUCCESS_TITLE"), t("ADDED_SUCCESS_DESC")),
					(error) => showDetailedErrorModal(t("ERROR"), error.message, JSON.stringify(error.data, null, 2)),
				);

				await daemonReleases.refetch();
			} catch (e) {
				showErrorNotification(e);
			}
		},
		[t, daemonReleases],
	);

	return {
		metrics,
		downloads: daemonReleases.data?.data,
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
