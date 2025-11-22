import { Button, Card, Divider, Stack, Text } from "@mantine/core";
import { modals, openConfirmModal } from "@mantine/modals";
import { useNavigate } from "react-router-dom";
import {
	deleteUserModRelease,
	type ModData,
	type ModReleaseData,
	useGetUserModReleases,
} from "../../_autogen/api.ts";
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

	const daemon = useDaemonSubscriptions(props.mod, props.release, props.form);

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
				{daemon.isSubscribedTo(props.release.id) ? (
					<Button
						variant={"light"}
						onClick={daemon.unsubscribe}
						loading={daemon.unsubscribing.loading}
					>
						Unsubscribe
					</Button>
				) : (
					<Button
						variant={"light"}
						onClick={daemon.subscribe}
						loading={daemon.subscribing.loading}
					>
						Subscribe
					</Button>
				)}
			</Stack>
		</Card>
	);
}
