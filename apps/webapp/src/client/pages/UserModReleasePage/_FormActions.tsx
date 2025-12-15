import { Button, Card, Divider, Stack, Text } from "@mantine/core";
import { modals, openConfirmModal } from "@mantine/modals";
import { StatusCodes } from "http-status-codes";
import { useNavigate } from "react-router-dom";
import { deleteUserModRelease, type ModData, type ModReleaseData, useGetUserModReleases } from "../../_autogen/api.ts";
import { ModReleaseDaemonControls } from "../../components/ModReleaseDaemonControls.tsx";
import { useAppTranslation } from "../../i18n/useAppTranslation.ts";
import { showErrorNotification } from "../../utils/showErrorNotification.tsx";
import { showSuccessNotification } from "../../utils/showSuccessNotification.tsx";
import type { UserModReleaseForm } from "./form.ts";

export function _FormActions(props: { form: UserModReleaseForm; mod: ModData; release: ModReleaseData }) {
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
				showSuccessNotification(t("DELETE_RELEASE_SUCCESS_TITLE"), t("DELETE_RELEASE_SUCCESS_DESC"));
				nav(`/user-mods/${props.mod.id}`);
			},
		});
	};

	const handleMarkAsLatest = async () => {
		try {
			const response = await fetch(`/api/user-mods/${props.mod.id}/releases/${props.release.id}/mark-latest`, {
				method: "POST",
				credentials: "include",
			});

			if (response.status !== StatusCodes.OK) {
				throw new Error("Failed to mark release as latest");
			}

			await releases.refetch();
			showSuccessNotification(
				"Release Marked as Latest",
				"This release is now marked as the active release for users to download.",
			);
		} catch (e) {
			showErrorNotification(e);
		}
	};

	return (
		<Card withBorder>
			<Stack>
				<Button type="submit">{t("SAVE_CHANGES")}</Button>
				<Divider />
				{!props.release.isLatest && (
					<>
						<Button variant={"filled"} color="blue" onClick={handleMarkAsLatest}>
							Mark as Latest Release
						</Button>
						<Divider />
					</>
				)}
				{props.form.isTouched() ? (
					<Button variant={"default"} onClick={handleDiscard}>
						{t("DISCARD_CHANGES")}
					</Button>
				) : (
					<Button variant={"default"} onClick={() => nav(`/user-mods/${props.mod.id}`)}>
						{t("BACK_TO_MOD_PAGE")}
					</Button>
				)}
				<Button color={"red"} variant={"outline"} onClick={handleDelete}>
					{t("DELETE_RELEASE")}
				</Button>
				<Divider />
				<ModReleaseDaemonControls mod={props.mod} release={props.release} form={props.form} />
			</Stack>
		</Card>
	);
}
