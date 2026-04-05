import { toggleReleaseById } from "@packages/clients";
import { useAsyncFn } from "react-use";
import { showErrorNotification } from "../showErrorNotification.tsx";
import { showSuccessNotification } from "../showSuccessNotification.tsx";
import { useAppTranslation } from "../useAppTranslation.ts";
import { useErrorModal } from "./useErrorModal.tsx";

export function useToggleReleaseById() {
	const { t } = useAppTranslation();
	const showErrorModal = useErrorModal();

	return useAsyncFn(
		async (releaseId: string) => {
			const [value, error] = await toggleReleaseById({ releaseId });
			if (error) {
				if (error.message) {
					showErrorModal(error.message);
				} else {
					showErrorNotification(new Error(error.type));
				}
			} else {
				if (value === "Enabled") showSuccessNotification(t("MOD_ENABLED_SUCCESS_TITLE"), t("MOD_ENABLED_SUCCESS_DESC"));
				else if (value === "Disabled")
					showSuccessNotification(t("MOD_DISABLED_SUCCESS_TITLE"), t("MOD_DISABLED_SUCCESS_DESC"));
			}
		},
		[t],
	);
}
