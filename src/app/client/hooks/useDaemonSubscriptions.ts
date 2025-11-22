import { useAsyncFn } from "react-use";
import type { ModData, ModReleaseData } from "../_autogen/api.ts";
import {
	subscribeToModRelease,
	unsubscribeFromModRelease,
	useGetAllSubscriptions,
} from "../_autogen/daemon_api.ts";
import { configureDaemon } from "../_autogen/daemon_fetch_client.ts";
import { useAppTranslation } from "../i18n/useAppTranslation.ts";
import type { UserModReleaseForm } from "../pages/UserModReleasePage/form.ts";
import { showErrorNotification } from "../utils/showErrorNotification.tsx";
import { showSuccessNotification } from "../utils/showSuccessNotification.tsx";

/**
 * Hook to subscribe to a mod release using data from a form.
 *
 * This hook provides a set of functions and state to manage subscriptions
 * with the daemon service. It includes a subscribe function that
 * will attempt to subscribe to the specified mod release using
 * the details provided either from the form or the release data.
 *
 * It also provides an unsubscribe function to remove the subscription.
 *
 * @param mod {ModData} - The mod data.
 * @param release {ModReleaseData} - The mod release data.
 * @param form {UserModReleaseForm} - The form containing user input for the mod release.
 */
export function useDaemonSubscriptions(
	mod: ModData,
	release: ModReleaseData,
	form?: UserModReleaseForm,
) {
	const { t } = useAppTranslation();
	const subscriptions = useGetAllSubscriptions();

	const [subscribing, subscribe] = useAsyncFn(async () => {
		try {
			await subscribeToModRelease({
				modId: mod.id,
				releaseId: release.id,
				modName: mod.name,
				version: form?.values.version || release.version,
				assets: form?.values.assets || release.assets,
				dependencies: mod.dependencies,
				missionScripts: form?.values.missionScripts || release.missionScripts,
				symbolicLinks: form?.values.symbolicLinks || release.symbolicLinks,
			});
			await subscriptions.refetch();
			showSuccessNotification(
				t("SUBSCRIBE_SUCCESS_TITLE"),
				t("SUBSCRIBE_SUCCESS_DESC"),
			);
		} catch (e) {
			showErrorNotification(e);
		}
	}, [form, mod, t, release]);

	const [unsubscribing, unsubscribe] = useAsyncFn(async () => {
		try {
			await unsubscribeFromModRelease(release.id);
			await subscriptions.refetch();
			showSuccessNotification(
				t("UNSUBSCRIBE_SUCCESS_TITLE"),
				t("UNSUBSCRIBE_SUCCESS_DESC"),
			);
		} catch (e) {
			showErrorNotification(e);
		}
	}, [form, mod, t, release]);

	return {
		subscribing,
		subscribe,
		unsubscribing,
		unsubscribe,
		subscriptions,
		configureDaemon,
		isSubscribedTo(releaseId: string) {
			return (
				subscriptions.data?.data.some((sub) => sub.releaseId === releaseId) ??
				false
			);
		},
	};
}
