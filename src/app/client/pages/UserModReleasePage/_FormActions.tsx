import { Button, Card, Divider, Progress, Stack, Text } from "@mantine/core";
import { modals, openConfirmModal } from "@mantine/modals";
import { isNumber } from "lodash";
import { useNavigate } from "react-router-dom";
import {
	deleteUserModRelease,
	type ModData,
	type ModReleaseData,
	useGetUserModReleases,
} from "../../_autogen/api.ts";
import { disableMod, enableMod } from "../../_autogen/daemon_api.ts";
import { useDaemonSubscriptions } from "../../hooks/useDaemonSubscriptions.ts";
import { useAppTranslation } from "../../i18n/useAppTranslation.ts";
import { showSuccessNotification } from "../../utils/showSuccessNotification.tsx";
import type { UserModReleaseForm } from "./form.ts";

export function _FormActions(props: {
	form: UserModReleaseForm;
	mod: ModData;
	release: ModReleaseData;
}) {
	const { t } = useAppTranslation();
	const nav = useNavigate();
	const releases = useGetUserModReleases(props.mod.id);

	const handleDiscard = () => {
		openConfirmModal({
			title: "Discard Changes",
			children: <Text>{t("DISCARD_CHANGES_CONFIRMATION")}</Text>,
			labels: { confirm: t("DISCARD"), cancel: t("CANCEL") },
			onCancel: modals.closeAll,
			onConfirm: () => {
				nav(`/user-mods/${props.mod.id}`);
			},
		});
	};

	const handleDelete = async () => {
		openConfirmModal({
			title: "Confirm Deletion",
			children: <Text>{t("DELETE_RELEASE_CONFIRMATION")}</Text>,
			labels: { confirm: t("DELETE"), cancel: t("CANCEL") },
			confirmProps: { color: "red" },
			onCancel: modals.closeAll,
			onConfirm: async () => {
				await deleteUserModRelease(props.mod.id, props.release.id);
				await releases.refetch();
				showSuccessNotification(
					t("DELETE_RELEASE_SUCCESS_TITLE"),
					t("DELETE_RELEASE_SUCCESS_DESC"),
				);
				nav(`/user-mods/${props.mod.id}`);
			},
		});
	};

	const handleToggle = async () => {
		if (daemon.isEnabled(props.release.id)) {
			await disableMod(props.release.id);
			showSuccessNotification(
				"Success",
				"Mod release has been disabled successfully.",
			);
		} else {
			await enableMod(props.release.id);
			showSuccessNotification(
				"Success",
				"Mod release has been enabled successfully.",
			);
		}
	};

	const daemon = useDaemonSubscriptions(props.mod, props.release, props.form);

	const progressIfSubscribed = daemon.getSubscriptionProgress(props.release.id);

	return (
		<Card withBorder>
			<Stack>
				<Button type="submit">{t("SAVE_CHANGES")}</Button>
				<Divider />
				{props.form.isTouched() ? (
					<Button variant={"default"} onClick={handleDiscard}>
						{t("DISCARD_CHANGES")}
					</Button>
				) : (
					<Button
						variant={"default"}
						onClick={() => nav(`/user-mods/${props.mod.id}`)}
					>
						{t("BACK_TO_MOD_PAGE")}
					</Button>
				)}
				<Button color={"red"} variant={"outline"} onClick={handleDelete}>
					{t("DELETE_RELEASE")}
				</Button>
				<Divider />
				<Stack gap={2}>
					{daemon.isSubscribedTo(props.release.id) ? (
						<Button
							variant={"light"}
							onClick={daemon.unsubscribe}
							loading={daemon.unsubscribing.loading}
							disabled={daemon.isUnavailable}
						>
							{progressIfSubscribed === undefined ||
							progressIfSubscribed === 100
								? "Unsubscribe"
								: "Cancel"}
						</Button>
					) : (
						<Button
							variant={"light"}
							onClick={daemon.subscribe}
							loading={daemon.subscribing.loading}
							disabled={daemon.isUnavailable}
						>
							Subscribe
						</Button>
					)}
					{isNumber(progressIfSubscribed) && (
						<Progress
							radius={"xs"}
							value={progressIfSubscribed}
							animated={progressIfSubscribed < 100}
							striped={progressIfSubscribed < 100}
						/>
					)}
					{daemon.isSubscribedTo(props.release.id) && (
						<Button variant={"light"} onClick={handleToggle}>
							{daemon.isEnabled(props.release.id) ? "Disable" : "Enable"}
						</Button>
					)}
				</Stack>
			</Stack>
		</Card>
	);
}
