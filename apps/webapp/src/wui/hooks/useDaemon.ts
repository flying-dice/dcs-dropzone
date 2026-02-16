import {
	getGetAllDaemonReleasesUrl,
	ModAndReleaseDataStatus,
	removeReleaseFromDaemon,
	useGetAllDaemonReleases,
} from "@packages/clients/daemon";
import { showErrorNotification, showSuccessNotification, useAppTranslation } from "@packages/dzui";
import { useAsyncFn } from "react-use";
import addReleaseToDaemonById, { type AddReleaseToDaemonByIdCommand } from "../commands/AddReleaseToDaemonById.ts";
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
	const showError = useErrorModal();

	const [adding, add] = useAsyncFn(
		async (
			modId: string,
			releaseId: string,
			variant: AddReleaseToDaemonByIdCommand["variant"],
			form?: UserModReleaseForm,
		) => {
			const result = await addReleaseToDaemonById({ releaseId, modId, form, variant });
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
				(error) => showError(error),
			);
			await daemonReleases.refetch();
		},
		[t, daemonReleases],
	);

	const [updating, update] = useAsyncFn(
		async (
			modId: string,
			currentReleaseId: string,
			latestReleaseId: string,
			variant: AddReleaseToDaemonByIdCommand["variant"],
		) => {
			try {
				await removeReleaseFromDaemon(currentReleaseId);

				const result = await addReleaseToDaemonById({ releaseId: latestReleaseId, modId, variant });
				result.match(
					() => showSuccessNotification(t("ADDED_SUCCESS_TITLE"), t("ADDED_SUCCESS_DESC")),
					(error) => showErrorNotification(new Error(t("ERROR_TAKING_ACTION", { error }))),
				);

				await daemonReleases.refetch();
			} catch (e) {
				showErrorNotification(e);
			}
		},
		[t, daemonReleases],
	);

	return {
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
