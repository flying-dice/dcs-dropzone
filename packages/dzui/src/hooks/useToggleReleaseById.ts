import { type ToggleReleaseByIdResultError, toggleReleaseById } from "@packages/clients";
import { useAsyncFn } from "react-use";
import type { I18nKeys } from "../I18nKeys.ts";
import { showErrorNotification } from "../showErrorNotification.tsx";
import { showSuccessNotification } from "../showSuccessNotification.tsx";
import { useAppTranslation } from "../useAppTranslation.ts";
import { useErrorModal } from "./useErrorModal.tsx";

const localisations: Record<ToggleReleaseByIdResultError["type"], I18nKeys> = {
	FailedToFindDaemonReleaseError: "MOD_NOT_FOUND_ERROR",
	FailedToGetDaemonReleasesError: "DAEMON_RELEASES_ERROR_DESC",
	ToggleReleaseError: "TOGGLE",
};

export function useToggleReleaseById() {
	const { t } = useAppTranslation();
	const showErrorModal = useErrorModal();

	return useAsyncFn(
		async (releaseId: string) => {
			const result = await toggleReleaseById({ releaseId });
			result.match(
				(ok) => {
					if (ok === "Enabled") showSuccessNotification(t("MOD_ENABLED_SUCCESS_TITLE"), t("MOD_ENABLED_SUCCESS_DESC"));
					else if (ok === "Disabled")
						showSuccessNotification(t("MOD_DISABLED_SUCCESS_TITLE"), t("MOD_DISABLED_SUCCESS_DESC"));
				},
				(error) => {
					if (error.message) {
						showErrorModal(error.message);
					} else {
						showErrorNotification(new Error(error.type));
					}
				},
			);
		},
		[t],
	);
}
